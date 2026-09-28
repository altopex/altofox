import { AssembleFile } from "../quality/quality-checker";
import { findNicheByIndustry } from "../../niches";
import { ImageSlotType } from "./stock-service";
import {
  generateDynamicImageQuery,
  resolvePageImage,
  resolveValidatedPageImage,
  ImageProviderType,
  ImageDeduplicationTracker,
  buildBingThumbnailUrl,
} from "./image-provider";
import { generateTradeSvgBuffer, generateTradeSvgDataUri } from "./trade-svg-fallback";
import { detectTradeCategory, extractPhotoId, resolvePhoto } from "./photo-service";

export interface ImagePlanSlot {
  id: string;
  slot: ImageSlotType;
  query: string;
  alt: string;
  serviceName?: string;
  width: number;
  height: number;
  localPath: string; // e.g. "images/certified-plumber-portland.jpg"
  localWebpPath: string;
  localSvgPath: string;
  localSvgFallback: string; // inline data URI
  pageSlug: string;
  status: "found" | "fallback_used" | "ai_generated" | "local_fallback";
  remoteUrl: string;
  fallbackUrl: string;
  allFallbacks: string[];
}

// Valid binary buffers that load in every browser without 404 or decoding errors
export const VALID_JPEG_BUFFER = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64"
);

export const VALID_WEBP_BUFFER = Buffer.from(
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAD8D+JaQAA3AA/ua1AAA=",
  "base64"
);

/**
 * Creates a comprehensive, contextual image plan for all pages in the website.
 * Generates unique, contextual image queries based on page service, location,
 * keyword, and search intent.
 * Enforces strict global deduplication (NO image used 2 times).
 */
export function createImagePlan(
  pages: Array<{ slug: string; title?: string; sections?: any[] }>,
  trade: string,
  city: string,
  businessName: string,
  locationPages?: Array<{ slug?: string; city: string; stateId: string }>,
  options: {
    preferredSource?: ImageProviderType;
    state?: string;
    pexelsKey?: string;
    pixabayKey?: string;
    deduplicationTracker?: ImageDeduplicationTracker;
  } = {}
): ImagePlanSlot[] {
  const plan: ImagePlanSlot[] = [];
  const tracker = options.deduplicationTracker || new ImageDeduplicationTracker();
  const usedPaths = new Set<string>();
  const tradeClean = trade.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const tradeCategory = detectTradeCategory(trade);

  let photoIndex = 1;

  // 1. Plan images for standard pages
  for (const page of pages) {
    const slug = page.slug.replace(/\.html$/, "");
    const pageTitle = page.title || slug.replace(/-/g, " ");
    const sections = page.sections || [];

    const isHomePage = slug === "index" || slug === "home";
    const isServicePage = slug.includes("service") || (!isHomePage && !slug.includes("contact") && !slug.includes("about") && !slug.includes("area"));
    const serviceName = isServicePage && !isHomePage ? pageTitle.replace(/\|.*$/, "").trim() : undefined;

    for (const section of sections) {
      const type = typeof section === "string" ? section : section?.type;
      let slotType: ImageSlotType = "service";
      let defaultWidth = 800;
      let defaultHeight = 533;
      let count = 1;

      if (type === "hero") {
        slotType = "hero";
        defaultWidth = 1920;
        defaultHeight = 1080;
      } else if (type === "about") {
        slotType = "about";
        defaultWidth = 800;
        defaultHeight = 600;
        count = 2;
      } else if (type === "gallery") {
        slotType = "gallery";
        defaultWidth = 800;
        defaultHeight = 600;
        count = 3;
      } else if (type === "services") {
        slotType = "service";
        defaultWidth = 800;
        defaultHeight = 533;
        const itemsList = Array.isArray(section?.content?.items)
          ? section.content.items
          : (Array.isArray(section?.content?.services) ? section.content.services : []);
        count = itemsList.length > 0 ? itemsList.length : 3;
      }

      for (let i = 0; i < count; i++) {
        let specificServiceName = serviceName;
        let itemTitle: string | undefined;

        if (slotType === "service") {
          const itemsList = Array.isArray(section?.content?.items)
            ? section.content.items
            : (Array.isArray(section?.content?.services) ? section.content.services : []);
          const sItem = itemsList[i];
          if (sItem) {
            itemTitle = typeof sItem === "string" ? sItem : (sItem.title || sItem.name || sItem.heading);
            if (itemTitle) {
              specificServiceName = itemTitle;
            }
          }
        } else if (slotType === "hero") {
          itemTitle = section?.content?.h1 || section?.content?.eyebrow || pageTitle;
          specificServiceName = isServicePage ? (serviceName || pageTitle) : undefined;
        } else if (slotType === "about") {
          itemTitle = i === 0
            ? (section?.content?.title || section?.content?.eyebrow || "Craftsman & Dedicated Team")
            : (section?.content?.headline || "Licensed Specialists in Action");
        } else if (slotType === "gallery") {
          const galleryTitles = [
            "Precision System Installation",
            "Residential Repair Restoration",
            "Modern Equipment Upgrade",
            "Certified Workmanship Result",
          ];
          itemTitle = galleryTitles[i % galleryTitles.length];
        }

        const baseName = `${tradeClean}-${slotType}-${slug}-${photoIndex}`;
        let localPath = `images/${baseName}.jpg`;
        if (usedPaths.has(localPath)) {
          localPath = `images/${baseName}-${i + 1}.jpg`;
        }
        usedPaths.add(localPath);

        const localSvgPath = localPath.replace(/\.jpg$/, ".svg");
        const localWebpPath = localPath.replace(/\.jpg$/, ".webp");

        // Check if section provided explicit query from AI
        const explicitSlot = typeof section === "object" && section?.images ? section.images[i] : undefined;
        const explicitQuery = explicitSlot?.query;
        const explicitAlt = explicitSlot?.alt;

        const resolved = resolvePageImage(
          {
            pageTitle: itemTitle || pageTitle,
            serviceName: specificServiceName,
            city,
            state: options.state,
            trade,
            slot: slotType,
            pageType: isHomePage ? "home" : isServicePage ? "service" : "standard",
            index: photoIndex + i,
            width: defaultWidth,
            height: defaultHeight,
            customAlt: explicitAlt,
          },
          {
            preferredSource: options.preferredSource,
            deduplicationTracker: tracker,
            pexelsKey: options.pexelsKey,
            pixabayKey: options.pixabayKey,
          }
        );

        const finalQuery = explicitQuery ? explicitQuery.trim() : resolved.query;
        const finalAlt = explicitAlt ? explicitAlt.trim() : resolved.alt;

        plan.push({
          id: `img-${slug}-${slotType}-${photoIndex}`,
          slot: slotType,
          query: finalQuery,
          alt: finalAlt,
          serviceName: specificServiceName,
          width: defaultWidth,
          height: defaultHeight,
          localPath,
          localWebpPath,
          localSvgPath,
          localSvgFallback: resolved.localSvgFallback,
          pageSlug: slug,
          status: "found",
          remoteUrl: resolved.url,
          fallbackUrl: resolved.fallbackUrl,
          allFallbacks: resolved.allFallbacks,
        });

        photoIndex++;
      }
    }
  }

  // 2. Plan hero images for Location Pages with unique city queries & copyright-free photos
  if (locationPages && locationPages.length > 0) {
    for (const loc of locationPages) {
      const locCityClean = loc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const locStateClean = loc.stateId.toLowerCase();
      const locSlug = loc.slug ? loc.slug.replace(/\.html$/, "") : `${tradeClean}-${locCityClean}-${locStateClean}`;
      const localPath = `images/${tradeClean}-hero-${locCityClean}-${locStateClean}.jpg`;

      if (!usedPaths.has(localPath)) {
        usedPaths.add(localPath);
        const localSvgPath = localPath.replace(/\.jpg$/, ".svg");
        const localWebpPath = localPath.replace(/\.jpg$/, ".webp");

        const resolvedLoc = resolvePageImage(
          {
            pageTitle: `${trade} in ${loc.city}, ${loc.stateId}`,
            city: loc.city,
            state: loc.stateId,
            stateCode: loc.stateId,
            trade,
            slot: "hero",
            pageType: "location",
            width: 1920,
            height: 1080,
          },
          {
            preferredSource: options.preferredSource,
            deduplicationTracker: tracker,
            pexelsKey: options.pexelsKey,
            pixabayKey: options.pixabayKey,
          }
        );

        plan.push({
          id: `img-loc-${locSlug}`,
          slot: "hero",
          query: resolvedLoc.query,
          alt: resolvedLoc.alt,
          width: 1920,
          height: 1080,
          localPath,
          localWebpPath,
          localSvgPath,
          localSvgFallback: resolvedLoc.localSvgFallback,
          pageSlug: locSlug,
          status: "found",
          remoteUrl: resolvedLoc.url,
          fallbackUrl: resolvedLoc.fallbackUrl,
          allFallbacks: resolvedLoc.allFallbacks,
        });
      }
    }
  }

  return plan;
}

/**
 * Pre-validates all image slots in the plan using the multi-source fallback chain.
 * Guarantees that every planned slot has an accessible URL or a safe local fallback.
 * Strictly enforces that NO image is used 2 times.
 */
export async function resolveImagePlanWithValidation(
  plan: ImagePlanSlot[],
  trade: string,
  city: string,
  options: {
    preferredSource?: ImageProviderType;
    state?: string;
    pexelsKey?: string;
    pixabayKey?: string;
    openaiKey?: string;
    providerCredentials?: {
      provider?: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
      organizationId?: string;
      providerName?: string;
    };
    deduplicationTracker?: ImageDeduplicationTracker;
    validateNetwork?: boolean;
    fastOfflinePreview?: boolean;
    maxValidationTimeMs?: number;
  } = {}
): Promise<ImagePlanSlot[]> {
  const validatedPlan: ImagePlanSlot[] = [];
  const deduplicationTracker = options.deduplicationTracker || new ImageDeduplicationTracker();
  const tradeCategory = detectTradeCategory(trade);

  if (options.fastOfflinePreview || options.validateNetwork === false) {
    for (const slot of plan) {
      const resolved = resolvePageImage(
        {
          trade,
          city,
          state: options.state,
          serviceName: slot.serviceName,
          slot: slot.slot,
          width: slot.width,
          height: slot.height,
          customAlt: slot.alt,
          pageSlug: slot.pageSlug,
        },
        {
          preferredSource: options.preferredSource,
          deduplicationTracker,
        }
      );

      validatedPlan.push({
        ...slot,
        query: resolved.query,
        remoteUrl: resolved.url,
        fallbackUrl: resolved.fallbackUrl,
        allFallbacks: resolved.allFallbacks,
        localSvgFallback: resolved.localSvgFallback,
        status: "found",
      });
    }
  } else {
    const startTime = Date.now();
    const maxBudgetMs = options.maxValidationTimeMs ?? 3500;
    let networkAllowed: boolean = options.validateNetwork ?? true;

    // Process in concurrent batches of 6 with aggregate timeout budget
    const BATCH_SIZE = 6;
    for (let i = 0; i < plan.length; i += BATCH_SIZE) {
      const chunk = plan.slice(i, i + BATCH_SIZE);

      if (networkAllowed && Date.now() - startTime >= maxBudgetMs) {
        networkAllowed = false;
      }

      const chunkResults = await Promise.all(
        chunk.map(async (slot) => {
          try {
            const resolved = await resolveValidatedPageImage(
              {
                trade,
                city,
                state: options.state,
                serviceName: slot.serviceName,
                slot: slot.slot,
                width: slot.width,
                height: slot.height,
                customAlt: slot.alt,
                pageSlug: slot.pageSlug,
              },
              {
                preferredSource: options.preferredSource,
                pexelsKey: options.pexelsKey,
                pixabayKey: options.pixabayKey,
                openaiKey: options.openaiKey,
                providerCredentials: options.providerCredentials,
                deduplicationTracker,
                validateNetwork: networkAllowed,
              }
            );

            return {
              ...slot,
              query: resolved.query,
              remoteUrl: resolved.url,
              fallbackUrl: resolved.fallbackUrl,
              allFallbacks: resolved.allFallbacks,
              localSvgFallback: resolved.localSvgFallback,
              status: resolved.status === "local_fallback" ? ("local_fallback" as const) : ("found" as const),
            };
          } catch {
            return slot;
          }
        })
      );

      validatedPlan.push(...chunkResults);
    }
  }

  // =========================================================================
  // POST-PLAN STRICT VERIFICATION PASS:
  // Zero duplicate images permitted! If any collision is detected, mutate immediately!
  // =========================================================================
  const seenPhotoIds = new Set<string>();
  const seenUrls = new Set<string>();

  for (let i = 0; i < validatedPlan.length; i++) {
    const slot = validatedPlan[i];
    const photoId = extractPhotoId(slot.remoteUrl);
    const isDuplicate =
      (photoId && seenPhotoIds.has(photoId)) ||
      (slot.remoteUrl && seenUrls.has(slot.remoteUrl));

    if (isDuplicate) {
      if (slot.slot === "hero") {
        // Hero MUST be copyright-free photo
        const replacement = resolvePhoto(tradeCategory, "hero", slot.query, i + 50, seenPhotoIds);
        slot.remoteUrl = replacement.url;
        slot.fallbackUrl = replacement.url;
        slot.allFallbacks = [replacement.url, slot.localSvgFallback];
        const newId = extractPhotoId(replacement.url);
        if (newId) seenPhotoIds.add(newId);
        seenUrls.add(replacement.url);
      } else {
        // Small image: mutate keywords dynamically
        const uniqueQ = deduplicationTracker.generateUniqueBingQuery(`${slot.query}+item${i}`, tradeCategory, slot.slot, i);
        const newUrl = buildBingThumbnailUrl(uniqueQ, slot.width, slot.height, i + 1);
        slot.remoteUrl = newUrl;
        slot.query = uniqueQ;
        const newId = extractPhotoId(newUrl);
        if (newId) seenPhotoIds.add(newId);
        seenUrls.add(newUrl);
      }
    } else {
      if (photoId) seenPhotoIds.add(photoId);
      if (slot.remoteUrl) seenUrls.add(slot.remoteUrl);
    }
  }

  return validatedPlan;
}

/**
 * Builds binary bundle files for all images in the plan.
 * Writes genuine, high-quality vector SVGs to images/*.svg AND valid fallback image buffers
 * so the downloaded ZIP works completely offline with beautiful assets.
 */
export function bundleImagesFromPlan(
  plan: ImagePlanSlot[],
  tradeOrOptions: string | { mainTrade?: string; trade?: string; city?: string } = "general",
  cityFallback: string = "Local Area"
): AssembleFile[] {
  const resolvedTrade = typeof tradeOrOptions === "object"
    ? (tradeOrOptions.mainTrade || tradeOrOptions.trade || "general")
    : (tradeOrOptions || "general");
  const resolvedCity = typeof tradeOrOptions === "object"
    ? (tradeOrOptions.city || "Local Area")
    : (cityFallback || "Local Area");

  const files: AssembleFile[] = [];
  const processedPaths = new Set<string>();

  for (const slot of plan) {
    const svgBuffer = generateTradeSvgBuffer({
      trade: resolvedTrade,
      slot: slot.slot,
      title: slot.alt,
      location: resolvedCity,
      width: slot.width,
      height: slot.height,
    });

    if (slot.localSvgPath && !processedPaths.has(slot.localSvgPath)) {
      processedPaths.add(slot.localSvgPath);
      files.push({
        path: slot.localSvgPath,
        content: svgBuffer.toString("utf8"),
        mimeType: "image/svg+xml",
      });
    }

    if (slot.localPath && !processedPaths.has(slot.localPath)) {
      processedPaths.add(slot.localPath);
      files.push({
        path: slot.localPath,
        content: VALID_JPEG_BUFFER.toString("base64"),
        mimeType: "image/jpeg",
        isBase64: true,
      });
    }

    if (slot.localWebpPath && !processedPaths.has(slot.localWebpPath)) {
      processedPaths.add(slot.localWebpPath);
      files.push({
        path: slot.localWebpPath,
        content: VALID_WEBP_BUFFER.toString("base64"),
        mimeType: "image/webp",
        isBase64: true,
      });
    }
  }

  return files;
}

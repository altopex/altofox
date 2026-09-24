const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const templates = [
  {
    title: "Emergency Plumber — Charlotte, NC",
    category: "Plumbing & Drainage",
    badge: "Local Service",
    description: "High-converting 24/7 emergency plumbing website with instant call buttons, local SEO schema, upfront pricing guarantee, and neighborhood service areas.",
    prompt: "Build an authoritative, high-converting local home service website for 'Carolina Pro Plumbing & Drain' located in Charlotte, North Carolina. Focus Keyword: 'emergency plumber in Charlotte NC'. Secondary Keywords: '24/7 drain cleaning, water heater repair, burst pipe repair, sewer line inspection Charlotte'. Target location: Charlotte, NC and surrounding areas (Matthews, Huntersville, Concord, Pineville). Include top emergency call bar with (704) 555-0199, hero with trust badges (Licensed NC Plumber #34891, 5-Star Google Rating, 45-Min Emergency Response), instant Free Estimate form, 6 core services grid, why choose us with upfront pricing, local customer testimonials from local neighborhoods, and Schema.org LocalBusiness JSON-LD markup.",
  },
  {
    title: "Licensed Electrician — San Jose, CA",
    category: "Electrical Services",
    badge: "Local Service",
    description: "Certified master electrician site for residential & EV charging in Silicon Valley with safety trust badges and instant quote booking.",
    prompt: "Build a modern, trustworthy local contractor website for 'Silicon Valley Bright Electric' serving San Jose, California. Focus Keyword: 'licensed electrician in San Jose CA'. Secondary Keywords: 'residential electrical repair, EV charger installation, panel upgrades 200 amp, emergency electrical service'. Target location: San Jose, CA and South Bay (Santa Clara, Sunnyvale, Cupertino, Campbell). Include emergency dispatch phone (408) 555-0182, clean hero with licensed CA C-10 badges, EV charger installation calculator, residential & commercial services grid, customer reviews from Willow Glen and Santana Row, and LocalBusiness schema.",
  },
  {
    title: "HVAC & AC Repair — Austin, TX",
    category: "Heating & Cooling",
    badge: "Local Service",
    description: "Fast-dispatch air conditioning and heating repair site for central Texas homeowners with seasonal tune-up specials and same-day scheduling.",
    prompt: "Build a high-conversion HVAC contractor website for 'Lone Star Cool & Heat' in Austin, Texas. Focus Keyword: 'emergency AC repair Austin TX'. Secondary Keywords: 'air conditioning installation, furnace tune-up, heat pump replacement, 24/7 HVAC repair Austin'. Target location: Austin, TX and Greater Area (Round Rock, Cedar Park, Pflugerville, Westlake). Include prominent call CTA (512) 555-0144, '$69 AC Diagnostic Special' promotion banner, trust badges (TACLA Licensed, NATE Certified), 6 service breakdown cards, local reviews from South Congress and Mueller, and LocalBusiness JSON-LD.",
  },
  {
    title: "Roofing Specialists — Denver, CO",
    category: "Roofing & Exterior",
    badge: "Local Service",
    description: "Hail damage inspection and residential re-roofing contractor website with storm response CTA and insurance claim assistance.",
    prompt: "Build an authoritative local roofing website for 'Mile High Roofing & Restoration' in Denver, Colorado. Focus Keyword: 'roofing contractor in Denver CO'. Secondary Keywords: 'hail damage roof repair, residential roof replacement, free roof inspection, insurance claim roofing specialist'. Target location: Denver Metro, CO (Aurora, Lakewood, Littleton, Centennial). Phone: (303) 555-0177. Include 'Free Drone Roof Inspection' booking form, before/after showcase, lifetime warranty badges, and Schema.org LocalBusiness markup.",
  },
  {
    title: "Eco Landscaping & Tree Care — Orlando, FL",
    category: "Lawn & Landscaping",
    badge: "Local Service",
    description: "Vibrant tropical lawn care, irrigation, and tree trimming website for homeowners with instant service quote form.",
    prompt: "Build an attractive, lush local website for 'Palmetto Green Landscaping' in Orlando, Florida. Focus Keyword: 'landscaping and lawn care Orlando FL'. Secondary Keywords: 'sprinkler repair, sod installation, palm tree trimming, commercial landscape maintenance'. Target location: Orlando, FL (Winter Park, Lake Nona, Windermere). Phone: (407) 555-0133. Features: seasonal packages, photo gallery of completed estates, quote request form, and customer testimonials.",
  },
];

async function main() {
  console.log("Updating and seeding local service templates...");
  // Clear old templates so new local home service templates appear prominently
  await prisma.template.deleteMany({});
  for (const t of templates) {
    await prisma.template.create({ data: t });
  }
  console.log("Local service templates seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

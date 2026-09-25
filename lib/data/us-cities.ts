import { CityData, CityWithDistance, formatDistanceAndDirection, haversineDistanceMiles } from "./geo-utils";

export type { CityData, CityWithDistance };

/**
 * Preprocessed US Cities Dataset (SimpleMaps US Cities Basic, CC BY 4.0)
 * Curated with geographic coordinates, counties, population estimates, and zip codes.
 */
export const US_CITIES: CityData[] = [
  // Texas - Dallas / Fort Worth Metroplex
  { id: "dallas-tx", city: "Dallas", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.7767, lng: -96.797, population: 1304379, zips: ["75201", "75202", "75204", "75206", "75214"] },
  { id: "fort-worth-tx", city: "Fort Worth", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.7555, lng: -97.3308, population: 956709, zips: ["76102", "76104", "76107", "76109"] },
  { id: "arlington-tx", city: "Arlington", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.7357, lng: -97.1081, population: 394266, zips: ["76010", "76011", "76012", "76013"] },
  { id: "plano-tx", city: "Plano", stateId: "TX", stateName: "Texas", county: "Collin", lat: 33.0198, lng: -96.6989, population: 285494, zips: ["75023", "75024", "75025", "75074"] },
  { id: "garland-tx", city: "Garland", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.9126, lng: -96.6389, population: 246018, zips: ["75040", "75041", "75042"] },
  { id: "irving-tx", city: "Irving", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.814, lng: -96.9489, population: 256684, zips: ["75038", "75039", "75060", "75061"] },
  { id: "frisco-tx", city: "Frisco", stateId: "TX", stateName: "Texas", county: "Collin", lat: 33.1507, lng: -96.8236, population: 210719, zips: ["75033", "75034", "75035", "75036"] },
  { id: "mckinney-tx", city: "McKinney", stateId: "TX", stateName: "Texas", county: "Collin", lat: 33.1972, lng: -96.6398, population: 195308, zips: ["75069", "75070", "75071"] },
  { id: "grand-prairie-tx", city: "Grand Prairie", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.746, lng: -96.9978, population: 196100, zips: ["75050", "75051", "75052"] },
  { id: "denton-tx", city: "Denton", stateId: "TX", stateName: "Texas", county: "Denton", lat: 33.2148, lng: -97.1331, population: 148146, zips: ["76201", "76205", "76208", "76209"] },
  { id: "mesquite-tx", city: "Mesquite", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.7668, lng: -96.5992, population: 150108, zips: ["75149", "75150", "75181"] },
  { id: "carrollton-tx", city: "Carrollton", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.9537, lng: -96.8903, population: 133434, zips: ["75006", "75007", "75010"] },
  { id: "richardson-tx", city: "Richardson", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.9483, lng: -96.7299, population: 119469, zips: ["75080", "75081", "75082"] },
  { id: "lewisville-tx", city: "Lewisville", stateId: "TX", stateName: "Texas", county: "Denton", lat: 33.0462, lng: -96.9942, population: 111822, zips: ["75057", "75067", "75077"] },
  { id: "allen-tx", city: "Allen", stateId: "TX", stateName: "Texas", county: "Collin", lat: 33.1032, lng: -96.6706, population: 104627, zips: ["75002", "75013"] },
  { id: "flower-mound-tx", city: "Flower Mound", stateId: "TX", stateName: "Texas", county: "Denton", lat: 33.0146, lng: -97.097, population: 76681, zips: ["75022", "75028"] },
  { id: "grapevine-tx", city: "Grapevine", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.9343, lng: -97.0781, population: 50631, zips: ["76051", "76099"] },
  { id: "southlake-tx", city: "Southlake", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.9412, lng: -97.1342, population: 31265, zips: ["76092"] },
  { id: "euless-tx", city: "Euless", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.8371, lng: -97.082, population: 61032, zips: ["76039", "76040"] },
  { id: "bedford-tx", city: "Bedford", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.844, lng: -97.1431, population: 49448, zips: ["76021", "76022"] },
  { id: "hurst-tx", city: "Hurst", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.8235, lng: -97.1706, population: 39682, zips: ["76053", "76054"] },
  { id: "north-richland-hills-tx", city: "North Richland Hills", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.8343, lng: -97.2292, population: 70258, zips: ["76180", "76182"] },
  { id: "mansfield-tx", city: "Mansfield", stateId: "TX", stateName: "Texas", county: "Tarrant", lat: 32.5632, lng: -97.1417, population: 73029, zips: ["76063"] },
  { id: "waxahachie-tx", city: "Waxahachie", stateId: "TX", stateName: "Texas", county: "Ellis", lat: 32.3865, lng: -96.8483, population: 41140, zips: ["75165", "75167"] },
  { id: "rockwall-tx", city: "Rockwall", stateId: "TX", stateName: "Texas", county: "Rockwall", lat: 32.9312, lng: -96.4597, population: 47251, zips: ["75032", "75087"] },
  { id: "rowlett-tx", city: "Rowlett", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.9029, lng: -96.5639, population: 62535, zips: ["75088", "75089"] },
  { id: "coppell-tx", city: "Coppell", stateId: "TX", stateName: "Texas", county: "Dallas", lat: 32.9546, lng: -97.015, population: 42983, zips: ["75019"] },
  { id: "prosper-tx", city: "Prosper", stateId: "TX", stateName: "Texas", county: "Collin", lat: 33.2362, lng: -96.8011, population: 34108, zips: ["75078"] },

  // Texas - Houston Metro
  { id: "houston-tx", city: "Houston", stateId: "TX", stateName: "Texas", county: "Harris", lat: 29.7604, lng: -95.3698, population: 2304580, zips: ["77002", "77005", "77006", "77019", "77024"] },
  { id: "pasadena-tx", city: "Pasadena", stateId: "TX", stateName: "Texas", county: "Harris", lat: 29.6911, lng: -95.2091, population: 151950, zips: ["77502", "77504", "77506"] },
  { id: "pearlan-tx", city: "Pearland", stateId: "TX", stateName: "Texas", county: "Brazoria", lat: 29.5636, lng: -95.286, population: 125828, zips: ["77581", "77584", "77588"] },
  { id: "sugar-land-tx", city: "Sugar Land", stateId: "TX", stateName: "Texas", county: "Fort Bend", lat: 29.6197, lng: -95.6349, population: 111026, zips: ["77478", "77479", "77498"] },
  { id: "the-woodlands-tx", city: "The Woodlands", stateId: "TX", stateName: "Texas", county: "Montgomery", lat: 30.1578, lng: -95.4894, population: 114436, zips: ["77380", "77381", "77382"] },
  { id: "katy-tx", city: "Katy", stateId: "TX", stateName: "Texas", county: "Harris", lat: 29.7858, lng: -95.8245, population: 21894, zips: ["77493", "77494"] },
  { id: "spring-tx", city: "Spring", stateId: "TX", stateName: "Texas", county: "Harris", lat: 30.0799, lng: -95.4172, population: 62559, zips: ["77373", "77379", "77389"] },
  { id: "conroe-tx", city: "Conroe", stateId: "TX", stateName: "Texas", county: "Montgomery", lat: 30.3119, lng: -95.456, population: 94448, zips: ["77301", "77304"] },

  // Texas - Austin Metro
  { id: "austin-tx", city: "Austin", stateId: "TX", stateName: "Texas", county: "Travis", lat: 30.2672, lng: -97.7431, population: 961855, zips: ["78701", "78702", "78704", "78745", "78759"] },
  { id: "round-rock-tx", city: "Round Rock", stateId: "TX", stateName: "Texas", county: "Williamson", lat: 30.5083, lng: -97.6789, population: 119468, zips: ["78664", "78665", "78681"] },
  { id: "cedar-park-tx", city: "Cedar Park", stateId: "TX", stateName: "Texas", county: "Williamson", lat: 30.5052, lng: -97.8203, population: 77595, zips: ["78613", "78630"] },
  { id: "georgetown-tx", city: "Georgetown", stateId: "TX", stateName: "Texas", county: "Williamson", lat: 30.6333, lng: -97.6778, population: 75420, zips: ["78626", "78628", "78633"] },
  { id: "pflugerville-tx", city: "Pflugerville", stateId: "TX", stateName: "Texas", county: "Travis", lat: 30.4548, lng: -97.6223, population: 65191, zips: ["78660"] },
  { id: "san-marcos-tx", city: "San Marcos", stateId: "TX", stateName: "Texas", county: "Hays", lat: 29.8833, lng: -97.9414, population: 67553, zips: ["78666"] },

  // Texas - San Antonio Metro
  { id: "san-antonio-tx", city: "San Antonio", stateId: "TX", stateName: "Texas", county: "Bexar", lat: 29.4241, lng: -98.4936, population: 1434625, zips: ["78201", "78205", "78209", "78216", "78258"] },
  { id: "new-braunfels-tx", city: "New Braunfels", stateId: "TX", stateName: "Texas", county: "Comal", lat: 29.703, lng: -98.1245, population: 90403, zips: ["78130", "78132"] },
  { id: "schertz-tx", city: "Schertz", stateId: "TX", stateName: "Texas", county: "Guadalupe", lat: 29.5522, lng: -98.2697, population: 42002, zips: ["78154"] },

  // California - Los Angeles & Orange County
  { id: "los-angeles-ca", city: "Los Angeles", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 34.0522, lng: -118.2437, population: 3898747, zips: ["90001", "90012", "90028", "90046", "90069"] },
  { id: "long-beach-ca", city: "Long Beach", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 33.7701, lng: -118.1937, population: 466742, zips: ["90802", "90803", "90807"] },
  { id: "glendale-ca", city: "Glendale", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 34.1425, lng: -118.2551, population: 196543, zips: ["91201", "91202", "91205"] },
  { id: "pasadena-ca", city: "Pasadena", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 34.1478, lng: -118.1445, population: 138699, zips: ["91101", "91103", "91105"] },
  { id: "burbank-ca", city: "Burbank", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 34.1808, lng: -118.309, population: 107337, zips: ["91501", "91502", "91505"] },
  { id: "santa-monica-ca", city: "Santa Monica", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 34.0195, lng: -118.4912, population: 93076, zips: ["90401", "90402", "90405"] },
  { id: "torrance-ca", city: "Torrance", stateId: "CA", stateName: "California", county: "Los Angeles", lat: 33.8358, lng: -118.3406, population: 147067, zips: ["90501", "90503", "90505"] },
  { id: "anaheim-ca", city: "Anaheim", stateId: "CA", stateName: "California", county: "Orange", lat: 33.8366, lng: -117.9143, population: 346824, zips: ["92801", "92802", "92804", "92805"] },
  { id: "santa-ana-ca", city: "Santa Ana", stateId: "CA", stateName: "California", county: "Orange", lat: 33.7455, lng: -117.8677, population: 310227, zips: ["92701", "92703", "92705"] },
  { id: "irvine-ca", city: "Irvine", stateId: "CA", stateName: "California", county: "Orange", lat: 33.6846, lng: -117.8265, population: 307670, zips: ["92602", "92604", "92612", "92618"] },
  { id: "huntington-beach-ca", city: "Huntington Beach", stateId: "CA", stateName: "California", county: "Orange", lat: 33.6595, lng: -117.9988, population: 198711, zips: ["92646", "92647", "92648"] },

  // California - SF Bay Area
  { id: "san-francisco-ca", city: "San Francisco", stateId: "CA", stateName: "California", county: "San Francisco", lat: 37.7749, lng: -122.4194, population: 873965, zips: ["94102", "94103", "94107", "94110", "94114"] },
  { id: "oakland-ca", city: "Oakland", stateId: "CA", stateName: "California", county: "Alameda", lat: 37.8044, lng: -122.2712, population: 440646, zips: ["94601", "94607", "94611", "94612"] },
  { id: "san-jose-ca", city: "San Jose", stateId: "CA", stateName: "California", county: "Santa Clara", lat: 37.3382, lng: -121.8863, population: 1013240, zips: ["95110", "95112", "95120", "95125"] },
  { id: "sunnyvale-ca", city: "Sunnyvale", stateId: "CA", stateName: "California", county: "Santa Clara", lat: 37.3688, lng: -122.0363, population: 153095, zips: ["94085", "94086", "94087"] },
  { id: "santa-clara-ca", city: "Santa Clara", stateId: "CA", stateName: "California", county: "Santa Clara", lat: 37.3541, lng: -121.9552, population: 127647, zips: ["95050", "95051", "95054"] },
  { id: "fremont-ca", city: "Fremont", stateId: "CA", stateName: "California", county: "Alameda", lat: 37.5485, lng: -121.9886, population: 230504, zips: ["94536", "94538", "94539"] },
  { id: "berkeley-ca", city: "Berkeley", stateId: "CA", stateName: "California", county: "Alameda", lat: 37.8716, lng: -122.2727, population: 124321, zips: ["94702", "94703", "94704"] },
  { id: "san-mateo-ca", city: "San Mateo", stateId: "CA", stateName: "California", county: "San Mateo", lat: 37.563, lng: -122.3255, population: 105661, zips: ["94401", "94402", "94403"] },

  // California - San Diego
  { id: "san-diego-ca", city: "San Diego", stateId: "CA", stateName: "California", county: "San Diego", lat: 32.7157, lng: -117.1611, population: 1386932, zips: ["92101", "92103", "92104", "92109", "92115"] },
  { id: "chula-vista-ca", city: "Chula Vista", stateId: "CA", stateName: "California", county: "San Diego", lat: 32.6401, lng: -117.0842, population: 275487, zips: ["91910", "91911", "91913"] },
  { id: "oceanside-ca", city: "Oceanside", stateId: "CA", stateName: "California", county: "San Diego", lat: 33.1959, lng: -117.3795, population: 174068, zips: ["92054", "92056", "92057"] },
  { id: "escondido-ca", city: "Escondido", stateId: "CA", stateName: "California", county: "San Diego", lat: 33.1192, lng: -117.0864, population: 151038, zips: ["92025", "92027", "92029"] },
  { id: "carlsbad-ca", city: "Carlsbad", stateId: "CA", stateName: "California", county: "San Diego", lat: 33.1581, lng: -117.3506, population: 114746, zips: ["92008", "92009", "92011"] },

  // Oregon - Portland Metro (from user prompt Beaverton, Portland, etc.)
  { id: "portland-or", city: "Portland", stateId: "OR", stateName: "Oregon", county: "Multnomah", lat: 45.5152, lng: -122.6784, population: 652503, zips: ["97201", "97202", "97204", "97209", "97214"] },
  { id: "beaverton-or", city: "Beaverton", stateId: "OR", stateName: "Oregon", county: "Washington", lat: 45.4871, lng: -122.8037, population: 97494, zips: ["97005", "97006", "97007", "97008"] },
  { id: "hillsboro-or", city: "Hillsboro", stateId: "OR", stateName: "Oregon", county: "Washington", lat: 45.5229, lng: -122.9898, population: 106447, zips: ["97123", "97124"] },
  { id: "gresham-or", city: "Gresham", stateId: "OR", stateName: "Oregon", county: "Multnomah", lat: 45.4998, lng: -122.4312, population: 114247, zips: ["97030", "97080"] },
  { id: "tigard-or", city: "Tigard", stateId: "OR", stateName: "Oregon", county: "Washington", lat: 45.4312, lng: -122.7712, population: 54539, zips: ["97223", "97224"] },
  { id: "lake-oswego-or", city: "Lake Oswego", stateId: "OR", stateName: "Oregon", county: "Clackamas", lat: 45.4207, lng: -122.6706, population: 40731, zips: ["97034", "97035"] },
  { id: "oregon-city-or", city: "Oregon City", stateId: "OR", stateName: "Oregon", county: "Clackamas", lat: 45.3573, lng: -122.6068, population: 37572, zips: ["97045"] },

  // Washington - Seattle Metro
  { id: "seattle-wa", city: "Seattle", stateId: "WA", stateName: "Washington", county: "King", lat: 47.6062, lng: -122.3321, population: 737015, zips: ["98101", "98103", "98105", "98115", "98122"] },
  { id: "bellevue-wa", city: "Bellevue", stateId: "WA", stateName: "Washington", county: "King", lat: 47.6101, lng: -122.2015, population: 151854, zips: ["98004", "98005", "98006", "98007"] },
  { id: "tacoma-wa", city: "Tacoma", stateId: "WA", stateName: "Washington", county: "Pierce", lat: 47.2529, lng: -122.4443, population: 219346, zips: ["98402", "98405", "98406", "98409"] },
  { id: "redmond-wa", city: "Redmond", stateId: "WA", stateName: "Washington", county: "King", lat: 47.674, lng: -122.1215, population: 73256, zips: ["98052", "98053"] },
  { id: "kirkland-wa", city: "Kirkland", stateId: "WA", stateName: "Washington", county: "King", lat: 47.6769, lng: -122.206, population: 92175, zips: ["98033", "98034"] },
  { id: "renton-wa", city: "Renton", stateId: "WA", stateName: "Washington", county: "King", lat: 47.4829, lng: -122.2171, population: 106785, zips: ["98055", "98056", "98057"] },

  // Arizona - Phoenix Metro
  { id: "phoenix-az", city: "Phoenix", stateId: "AZ", stateName: "Arizona", county: "Maricopa", lat: 33.4484, lng: -112.074, population: 1608139, zips: ["85001", "85004", "85016", "85020", "85044"] },
  { id: "mesa-az", city: "Mesa", stateId: "AZ", stateName: "Arizona", county: "Maricopa", lat: 33.4152, lng: -111.8315, population: 504258, zips: ["85201", "85203", "85205", "85208"] },
  { id: "chandler-az", city: "Chandler", stateId: "AZ", stateName: "Arizona", county: "Maricopa", lat: 33.3062, lng: -111.8413, population: 275987, zips: ["85224", "85225", "85248"] },
  { id: "scottsdale-az", city: "Scottsdale", stateId: "AZ", stateName: "Arizona", county: "Maricopa", lat: 33.4942, lng: -111.9261, population: 241361, zips: ["85251", "85254", "85255", "85258"] },
  { id: "gilbert-az", city: "Gilbert", stateId: "AZ", stateName: "Arizona", county: "Maricopa", lat: 33.3528, lng: -111.789, population: 267918, zips: ["85233", "85234", "85295"] },
  { id: "glendale-az", city: "Glendale", stateId: "AZ", stateName: "Arizona", county: "Maricopa", lat: 33.5387, lng: -112.186, population: 248325, zips: ["85301", "85302", "85304"] },

  // Colorado - Denver Metro
  { id: "denver-co", city: "Denver", stateId: "CO", stateName: "Colorado", county: "Denver", lat: 39.7392, lng: -104.9903, population: 715522, zips: ["80202", "80205", "80206", "80209", "80211"] },
  { id: "aurora-co", city: "Aurora", stateId: "CO", stateName: "Colorado", county: "Arapahoe", lat: 39.7294, lng: -104.8319, population: 386261, zips: ["80010", "80012", "80014", "80016"] },
  { id: "lakewood-co", city: "Lakewood", stateId: "CO", stateName: "Colorado", county: "Jefferson", lat: 39.7047, lng: -105.0814, population: 155984, zips: ["80214", "80215", "80226", "80228"] },
  { id: "thornton-co", city: "Thornton", stateId: "CO", stateName: "Colorado", county: "Adams", lat: 39.868, lng: -104.9719, population: 141867, zips: ["80229", "80233", "80241"] },
  { id: "boulder-co", city: "Boulder", stateId: "CO", stateName: "Colorado", county: "Boulder", lat: 40.015, lng: -105.2705, population: 108250, zips: ["80301", "80302", "80304"] },

  // Illinois - Chicago Metro
  { id: "chicago-il", city: "Chicago", stateId: "IL", stateName: "Illinois", county: "Cook", lat: 41.8781, lng: -87.6298, population: 2746388, zips: ["60601", "60605", "60611", "60614", "60622"] },
  { id: "aurora-il", city: "Aurora", stateId: "IL", stateName: "Illinois", county: "Kane", lat: 41.7606, lng: -88.3201, population: 180542, zips: ["60504", "60505", "60506"] },
  { id: "naperville-il", city: "Naperville", stateId: "IL", stateName: "Illinois", county: "DuPage", lat: 41.7508, lng: -88.1535, population: 149540, zips: ["60540", "60563", "60564"] },
  { id: "joliet-il", city: "Joliet", stateId: "IL", stateName: "Illinois", county: "Will", lat: 41.525, lng: -88.0817, population: 150362, zips: ["60431", "60432", "60435"] },
  { id: "evanston-il", city: "Evanston", stateId: "IL", stateName: "Illinois", county: "Cook", lat: 42.0451, lng: -87.6877, population: 78110, zips: ["60201", "60202"] },

  // Florida - Miami & Tampa & Orlando
  { id: "miami-fl", city: "Miami", stateId: "FL", stateName: "Florida", county: "Miami-Dade", lat: 25.7617, lng: -80.1918, population: 442241, zips: ["33125", "33129", "33130", "33133", "33137"] },
  { id: "fort-lauderdale-fl", city: "Fort Lauderdale", stateId: "FL", stateName: "Florida", county: "Broward", lat: 26.1224, lng: -80.1373, population: 182760, zips: ["33301", "33304", "33308"] },
  { id: "tampa-fl", city: "Tampa", stateId: "FL", stateName: "Florida", county: "Hillsborough", lat: 27.9506, lng: -82.4572, population: 384959, zips: ["33602", "33606", "33609", "33611"] },
  { id: "orlando-fl", city: "Orlando", stateId: "FL", stateName: "Florida", county: "Orange", lat: 28.5383, lng: -81.3792, population: 307573, zips: ["32801", "32803", "32806", "32819"] },
  { id: "st-petersburg-fl", city: "St. Petersburg", stateId: "FL", stateName: "Florida", county: "Pinellas", lat: 27.7676, lng: -82.6403, population: 258308, zips: ["33701", "33704", "33705"] },
  { id: "jacksonville-fl", city: "Jacksonville", stateId: "FL", stateName: "Florida", county: "Duval", lat: 30.3322, lng: -81.6557, population: 949611, zips: ["32202", "32204", "32207", "32210"] },

  // Georgia - Atlanta Metro
  { id: "atlanta-ga", city: "Atlanta", stateId: "GA", stateName: "Georgia", county: "Fulton", lat: 33.749, lng: -84.388, population: 498715, zips: ["30303", "30305", "30308", "30309", "30327"] },
  { id: "marietta-ga", city: "Marietta", stateId: "GA", stateName: "Georgia", county: "Cobb", lat: 33.9526, lng: -84.5499, population: 60972, zips: ["30060", "30062", "30064"] },
  { id: "alpharetta-ga", city: "Alpharetta", stateId: "GA", stateName: "Georgia", county: "Fulton", lat: 34.0754, lng: -84.2941, population: 65818, zips: ["30004", "30005", "30009"] },
  { id: "roswell-ga", city: "Roswell", stateId: "GA", stateName: "Georgia", county: "Fulton", lat: 34.0232, lng: -84.3616, population: 92833, zips: ["30075", "30076"] },
  { id: "sandy-springs-ga", city: "Sandy Springs", stateId: "GA", stateName: "Georgia", county: "Fulton", lat: 33.9304, lng: -84.3733, population: 108080, zips: ["30328", "30350"] },

  // New York / New Jersey / Connecticut Tri-State
  { id: "new-york-ny", city: "New York", stateId: "NY", stateName: "New York", county: "New York", lat: 40.7128, lng: -74.006, population: 8336817, zips: ["10001", "10011", "10019", "10024", "10028"] },
  { id: "brooklyn-ny", city: "Brooklyn", stateId: "NY", stateName: "New York", county: "Kings", lat: 40.6782, lng: -73.9442, population: 2576771, zips: ["11201", "11211", "11215", "11217"] },
  { id: "queens-ny", city: "Queens", stateId: "NY", stateName: "New York", county: "Queens", lat: 40.7282, lng: -73.7949, population: 2270976, zips: ["11354", "11375", "11101"] },
  { id: "white-plains-ny", city: "White Plains", stateId: "NY", stateName: "New York", county: "Westchester", lat: 41.0339, lng: -73.7629, population: 59559, zips: ["10601", "10605"] },
  { id: "jersey-city-nj", city: "Jersey City", stateId: "NJ", stateName: "New Jersey", county: "Hudson", lat: 40.7178, lng: -74.0431, population: 292449, zips: ["07302", "07304", "07306"] },
  { id: "newark-nj", city: "Newark", stateId: "NJ", stateName: "New Jersey", county: "Essex", lat: 40.7357, lng: -74.1724, population: 311549, zips: ["07102", "07104", "07105"] },

  // North Carolina - Charlotte & Raleigh
  { id: "charlotte-nc", city: "Charlotte", stateId: "NC", stateName: "North Carolina", county: "Mecklenburg", lat: 35.2271, lng: -80.8431, population: 874579, zips: ["28202", "28203", "28209", "28277"] },
  { id: "raleigh-nc", city: "Raleigh", stateId: "NC", stateName: "North Carolina", county: "Wake", lat: 35.7796, lng: -78.6382, population: 467665, zips: ["27601", "27603", "27607", "27609"] },
  { id: "durham-nc", city: "Durham", stateId: "NC", stateName: "North Carolina", county: "Durham", lat: 35.994, lng: -78.8986, population: 283506, zips: ["27701", "27705", "27707"] },
  { id: "cary-nc", city: "Cary", stateId: "NC", stateName: "North Carolina", county: "Wake", lat: 35.7915, lng: -78.7811, population: 174721, zips: ["27511", "27513", "27519"] },

  // Tennessee - Nashville Metro
  { id: "nashville-tn", city: "Nashville", stateId: "TN", stateName: "Tennessee", county: "Davidson", lat: 36.1627, lng: -86.7816, population: 689447, zips: ["37201", "37203", "37206", "37212", "37215"] },
  { id: "franklin-tn", city: "Franklin", stateId: "TN", stateName: "Tennessee", county: "Williamson", lat: 35.9251, lng: -86.8689, population: 83454, zips: ["37064", "37067", "37069"] },
  { id: "brentwood-tn", city: "Brentwood", stateId: "TN", stateName: "Tennessee", county: "Williamson", lat: 36.0331, lng: -86.7828, population: 45373, zips: ["37027"] },
  { id: "murfreesboro-tn", city: "Murfreesboro", stateId: "TN", stateName: "Tennessee", county: "Rutherford", lat: 35.8456, lng: -86.3903, population: 152769, zips: ["37128", "37129", "37130"] },

  // Pennsylvania - Philadelphia & Pittsburgh
  { id: "philadelphia-pa", city: "Philadelphia", stateId: "PA", stateName: "Pennsylvania", county: "Philadelphia", lat: 39.9526, lng: -75.1652, population: 1603797, zips: ["19102", "19103", "19106", "19147"] },
  { id: "pittsburgh-pa", city: "Pittsburgh", stateId: "PA", stateName: "Pennsylvania", county: "Allegheny", lat: 40.4406, lng: -79.9959, population: 302971, zips: ["15201", "15206", "15213", "15222"] },

  // Massachusetts - Boston Metro
  { id: "boston-ma", city: "Boston", stateId: "MA", stateName: "Massachusetts", county: "Suffolk", lat: 42.3601, lng: -71.0589, population: 675647, zips: ["02108", "02114", "02116", "02127"] },
  { id: "cambridge-ma", city: "Cambridge", stateId: "MA", stateName: "Massachusetts", county: "Middlesex", lat: 42.3736, lng: -71.1097, population: 118403, zips: ["02138", "02139", "02142"] },
  { id: "somerville-ma", city: "Somerville", stateId: "MA", stateName: "Massachusetts", county: "Middlesex", lat: 42.3876, lng: -71.0995, population: 81045, zips: ["02143", "02144", "02145"] },

  // Ohio - Columbus, Cleveland, Cincinnati
  { id: "columbus-oh", city: "Columbus", stateId: "OH", stateName: "Ohio", county: "Franklin", lat: 39.9612, lng: -82.9988, population: 905748, zips: ["43201", "43206", "43214", "43215"] },
  { id: "cleveland-oh", city: "Cleveland", stateId: "OH", stateName: "Ohio", county: "Cuyahoga", lat: 41.4993, lng: -81.6944, population: 372624, zips: ["44102", "44113", "44114"] },
  { id: "cincinnati-oh", city: "Cincinnati", stateId: "OH", stateName: "Ohio", county: "Hamilton", lat: 39.1031, lng: -84.512, population: 309317, zips: ["45202", "45208", "45220"] },

  // Michigan - Detroit Metro
  { id: "detroit-mi", city: "Detroit", stateId: "MI", stateName: "Michigan", county: "Wayne", lat: 42.3314, lng: -83.0458, population: 639111, zips: ["48201", "48202", "48226"] },
  { id: "ann-arbor-mi", city: "Ann Arbor", stateId: "MI", stateName: "Michigan", county: "Washtenaw", lat: 42.2808, lng: -83.743, population: 123851, zips: ["48103", "48104", "48105"] },

  // Minnesota - Minneapolis / St. Paul
  { id: "minneapolis-mn", city: "Minneapolis", stateId: "MN", stateName: "Minnesota", county: "Hennepin", lat: 44.9778, lng: -93.265, population: 429954, zips: ["55401", "55403", "55408"] },
  { id: "st-paul-mn", city: "St. Paul", stateId: "MN", stateName: "Minnesota", county: "Ramsey", lat: 44.9537, lng: -93.09, population: 311527, zips: ["55101", "55102", "55104"] },

  // Missouri - Kansas City & St. Louis
  { id: "kansas-city-mo", city: "Kansas City", stateId: "MO", stateName: "Missouri", county: "Jackson", lat: 39.0997, lng: -94.5786, population: 508090, zips: ["64105", "64108", "64111"] },
  { id: "st-louis-mo", city: "St. Louis", stateId: "MO", stateName: "Missouri", county: "St. Louis", lat: 38.627, lng: -90.1994, population: 301578, zips: ["63101", "63103", "63108"] },

  // Nevada - Las Vegas Metro
  { id: "las-vegas-nv", city: "Las Vegas", stateId: "NV", stateName: "Nevada", county: "Clark", lat: 36.1699, lng: -115.1398, population: 641903, zips: ["89101", "89109", "89117", "89128"] },
  { id: "henderson-nv", city: "Henderson", stateId: "NV", stateName: "Nevada", county: "Clark", lat: 36.0395, lng: -114.9817, population: 317610, zips: ["89012", "89052", "89074"] },
  { id: "reno-nv", city: "Reno", stateId: "NV", stateName: "Nevada", county: "Washoe", lat: 39.5296, lng: -119.8138, population: 264165, zips: ["89501", "89503", "89509"] },

  // Utah - Salt Lake City
  { id: "salt-lake-city-ut", city: "Salt Lake City", stateId: "UT", stateName: "Utah", county: "Salt Lake", lat: 40.7608, lng: -111.891, population: 199723, zips: ["84101", "84103", "84105", "84108"] },
  { id: "west-valley-city-ut", city: "West Valley City", stateId: "UT", stateName: "Utah", county: "Salt Lake", lat: 40.6916, lng: -111.9963, population: 140230, zips: ["84119", "84120"] },
  { id: "provo-ut", city: "Provo", stateId: "UT", stateName: "Utah", county: "Utah", lat: 40.2338, lng: -111.6585, population: 115162, zips: ["84601", "84604"] },

  // Indiana - Indianapolis
  { id: "indianapolis-in", city: "Indianapolis", stateId: "IN", stateName: "Indiana", county: "Marion", lat: 39.7684, lng: -86.1581, population: 887642, zips: ["46201", "46204", "46220"] },
  { id: "carmel-in", city: "Carmel", stateId: "IN", stateName: "Indiana", county: "Hamilton", lat: 39.9784, lng: -86.118, population: 99757, zips: ["46032", "46033"] },

  // Maryland / Virginia / DC Metro
  { id: "washington-dc", city: "Washington", stateId: "DC", stateName: "District of Columbia", county: "District of Columbia", lat: 38.9072, lng: -77.0369, population: 689545, zips: ["20001", "20005", "20009", "20016"] },
  { id: "baltimore-md", city: "Baltimore", stateId: "MD", stateName: "Maryland", county: "Baltimore", lat: 39.2904, lng: -76.6122, population: 585708, zips: ["21201", "21211", "21230"] },
  { id: "arlington-va", city: "Arlington", stateId: "VA", stateName: "Virginia", county: "Arlington", lat: 38.8799, lng: -77.1068, population: 238643, zips: ["22201", "22202", "22207"] },
  { id: "alexandria-va", city: "Alexandria", stateId: "VA", stateName: "Virginia", county: "Alexandria", lat: 38.8048, lng: -77.0469, population: 159467, zips: ["22301", "22314"] },
];

/**
 * Find city by exact name and state (case-insensitive)
 */
export function findCityByName(city: string, stateId?: string): CityData | undefined {
  const normCity = city.trim().toLowerCase();
  const normState = stateId?.trim().toUpperCase();

  return US_CITIES.find((c) => {
    const matchCity = c.city.toLowerCase() === normCity;
    if (!matchCity) return false;
    if (normState) {
      return c.stateId === normState || c.stateName.toUpperCase() === normState;
    }
    return true;
  });
}

/**
 * Autocomplete search for cities by query string (matches city or state)
 */
export function searchCities(query: string, maxResults = 10): CityData[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return US_CITIES.filter((c) => {
    return (
      c.city.toLowerCase().includes(q) ||
      `${c.city.toLowerCase()}, ${c.stateId.toLowerCase()}`.includes(q) ||
      c.county.toLowerCase().includes(q) ||
      c.zips.some((z) => z.startsWith(q))
    );
  })
    .sort((a, b) => b.population - a.population)
    .slice(0, maxResults);
}

/**
 * Find all cities within a specified radius (miles) from an origin point.
 * Returns cities sorted by distance (closest first).
 */
export function findCitiesWithinRadius(
  originLat: number,
  originLng: number,
  radiusMiles: number
): CityWithDistance[] {
  const results: CityWithDistance[] = [];

  for (const c of US_CITIES) {
    const dist = haversineDistanceMiles(originLat, originLng, c.lat, c.lng);
    if (dist <= radiusMiles) {
      const { direction, formatted } = formatDistanceAndDirection(originLat, originLng, c.lat, c.lng);
      results.push({
        ...c,
        distanceMiles: dist,
        direction,
        formattedOffset: formatted,
      });
    }
  }

  // Sort ascending by distance
  return results.sort((a, b) => a.distanceMiles - b.distanceMiles);
}

/**
 * Find all cities in a specific state and county.
 */
export function findCitiesByCounty(stateId: string, countyName: string): CityData[] {
  const normState = stateId.trim().toUpperCase();
  const normCounty = countyName.trim().toLowerCase();

  return US_CITIES.filter(
    (c) => c.stateId === normState && c.county.toLowerCase().includes(normCounty)
  ).sort((a, b) => b.population - a.population);
}

/**
 * Get unique list of counties for a given state.
 */
export function getCountiesForState(stateId: string): string[] {
  const normState = stateId.trim().toUpperCase();
  const counties = new Set<string>();

  for (const c of US_CITIES) {
    if (c.stateId === normState && c.county) {
      counties.add(c.county);
    }
  }

  return Array.from(counties).sort();
}

/**
 * Get unique list of all states available in the dataset.
 */
export function getAvailableStates(): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const c of US_CITIES) {
    if (!map.has(c.stateId)) {
      map.set(c.stateId, c.stateName);
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Helper to compute nearest 3–5 other selected cities from a candidate city.
 */
export function getNearestSelectedCities(
  targetCity: { lat: number; lng: number; city: string; stateId: string },
  selectedCities: { lat: number; lng: number; city: string; stateId: string; slug?: string }[],
  limit = 4
): { city: string; stateId: string; distanceMiles: number; slug?: string }[] {
  return selectedCities
    .filter((c) => !(c.city === targetCity.city && c.stateId === targetCity.stateId))
    .map((c) => ({
      city: c.city,
      stateId: c.stateId,
      slug: c.slug,
      distanceMiles: haversineDistanceMiles(targetCity.lat, targetCity.lng, c.lat, c.lng),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, limit);
}

// Demo event catalogue. Dates are relative to seed time so the calendar always looks current.
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

const at = (daysFromNow, hour, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const galleries = {
  Technology: ["photo-1540575467063-178a50c2df87", "photo-1515187029135-18ee286d815b", "photo-1591115765373-5207764f72e7"],
  Music: ["photo-1470229722913-7c0e2dbbafd3", "photo-1459749411175-04bf5292ceea", "photo-1514525253161-7a46d19cd819"],
  Art: ["photo-1531058020387-3be344556be6", "photo-1513364776144-60967b0f800f", "photo-1460661419201-fd4cecdf8a8b"],
  Design: ["photo-1558655146-9f40138edfeb", "photo-1586717791821-3f44a563fa4c", "photo-1523726491678-bf852e717f6a"],
  Food: ["photo-1555939594-58d7cb561ad1", "photo-1414235077428-338989a2e8c0", "photo-1476224203421-9ac39bcb3327"],
  Community: ["photo-1511632765486-a01980e01a18", "photo-1529156069898-49953e39b3ac", "photo-1523580494863-6f3031224c94"],
  Wellness: ["photo-1545205597-3d9d02c29597", "photo-1506126613408-eca07ce68773", "photo-1544367567-0f2fcb009e0b"],
  Business: ["photo-1556761175-5973dc0f32e7", "photo-1552664730-d307ca884978", "photo-1517245386807-bb43f82c33c4"],
  Education: ["photo-1509062522246-3755977927d7", "photo-1524178232363-1fb2b075b655", "photo-1427504494785-3a9ca7044f45"],
};

const catalogue = [
  {
    name: "Lahore Tech Summit 2026",
    category: "Technology",
    location: "Expo Centre, Johar Town, Lahore",
    date: at(6, 9, 30),
    price: 45,
    capacity: 300,
    image: img("photo-1540575467063-178a50c2df87"),
    description:
      "A full-day conference bringing together engineers, founders, and students to explore AI in production, cloud-native architecture, and the future of Pakistan's software industry. Expect three keynote tracks, hands-on labs, and a startup showcase in the main hall. Lunch and a printed schedule are included with every ticket.",
  },
  {
    name: "Afterglow: Indie Sessions",
    category: "Music",
    location: "The Courtyard, Gulberg, Lahore",
    date: at(8, 20, 0),
    price: 25,
    capacity: 120,
    image: img("photo-1470229722913-7c0e2dbbafd3"),
    description:
      "An intimate evening of independent music featuring four emerging acts from Lahore and Karachi. Low lights, a small stage, and a room full of people who came to listen. Doors open at 7:30 PM; the first set starts at 8. Standing room only, so arrive early for a good spot.",
  },
  {
    name: "Objects With Purpose",
    category: "Art",
    location: "Canvas House, Model Town, Lahore",
    date: at(10, 17, 0),
    price: 0,
    capacity: 80,
    image: img("photo-1531058020387-3be344556be6"),
    description:
      "A curated exhibition of contemporary product design and sculpture from twelve Pakistani makers. The opening night includes a guided walkthrough with the curators and short talks from three of the featured artists. Free entry — registration is required as the gallery has limited capacity.",
  },
  {
    name: "Designing Better Cities Workshop",
    category: "Design",
    location: "Studio 04, DHA Phase 5, Lahore",
    date: at(12, 10, 0),
    price: 30,
    capacity: 40,
    image: img("photo-1558655146-9f40138edfeb"),
    description:
      "A hands-on urban design workshop for architects, planners, and curious citizens. Working in small teams, you will map a real Lahore neighbourhood, identify friction points for pedestrians, and prototype low-cost interventions. Materials, coffee, and a light lunch are provided.",
  },
  {
    name: "Coffee & Code Circle",
    category: "Technology",
    location: "Northside Cafe, Johar Town, Lahore",
    date: at(13, 18, 30),
    price: 15,
    capacity: 60,
    image: img("photo-1515187029135-18ee286d815b"),
    description:
      "A relaxed monthly meet-up for developers, makers, and founders. Bring a laptop and a problem you are stuck on — or just come for the conversation. This month's lightning talks cover TypeScript tooling, MongoDB indexing pitfalls, and shipping side projects. Ticket includes a drink of your choice.",
  },
  {
    name: "Neighbourhood Food Stories",
    category: "Food",
    location: "Harvest Table, Gulberg III, Lahore",
    date: at(15, 19, 30),
    price: 35,
    capacity: 50,
    image: img("photo-1555939594-58d7cb561ad1"),
    description:
      "A long-table dinner built around family recipes from Lahore's oldest neighbourhoods. Each of the five courses is introduced by the person who grew up eating it. Vegetarian options are available on request. Seats are shared, so expect to leave with a few new friends.",
  },
  {
    name: "Founders Breakfast: Raising Your First Round",
    category: "Business",
    location: "Arfa Software Technology Park, Lahore",
    date: at(17, 8, 30),
    price: 20,
    capacity: 70,
    image: img("photo-1556761175-5973dc0f32e7"),
    description:
      "An early-morning session for founders preparing to raise seed capital. Two investors and two recently funded founders walk through what a fundable deck looks like, how to structure a SAFE, and the mistakes that quietly kill deals. Breakfast is served from 8:00 AM.",
  },
  {
    name: "Sunrise Yoga at Jilani Park",
    category: "Wellness",
    location: "Jilani Park (Racecourse), Lahore",
    date: at(19, 6, 30),
    price: 10,
    capacity: 45,
    image: img("photo-1545205597-3d9d02c29597"),
    description:
      "A gentle outdoor yoga flow suitable for all levels, led by certified instructors as the sun comes up over the park. Mats are provided, or bring your own. The session ends with ten minutes of guided breathing and fresh fruit. Please arrive fifteen minutes early to settle in.",
  },
  {
    name: "Open Studio Night",
    category: "Art",
    location: "The Yard, Lawrence Road, Lahore",
    date: at(21, 18, 0),
    price: 12,
    capacity: 100,
    image: img("photo-1460661419201-fd4cecdf8a8b"),
    description:
      "For one night, eighteen independent artists open their studios to the public. Walk between spaces, watch live printmaking and ceramics demonstrations, and buy directly from the makers. A map and a welcome drink are included with your ticket.",
  },
  {
    name: "Sound & Systems: Audio Production Workshop",
    category: "Music",
    location: "Signal Lab, Clifton, Karachi",
    date: at(23, 11, 0),
    price: 40,
    capacity: 30,
    image: img("photo-1514525253161-7a46d19cd819"),
    description:
      "A practical, small-group workshop on recording and mixing for musicians and podcasters. Learn microphone technique, gain staging, EQ, and compression on a real session, then take home the project files. No prior production experience needed; laptops with Reaper are provided.",
  },
  {
    name: "Inclusive Cities Lab",
    category: "Community",
    location: "Alhamra Arts Council, Mall Road, Lahore",
    date: at(25, 15, 0),
    price: 0,
    capacity: 90,
    image: img("photo-1511632765486-a01980e01a18"),
    description:
      "A collaborative afternoon on accessibility, public transport, and housing, hosted with local civic groups. Short presentations are followed by facilitated working groups whose recommendations will be shared with the city. Open to everyone; sign language interpretation is available.",
  },
  {
    name: "Teaching With AI: A Practical Day for Educators",
    category: "Education",
    location: "University of the Punjab, Quaid-e-Azam Campus, Lahore",
    date: at(27, 9, 0),
    price: 18,
    capacity: 120,
    image: img("photo-1509062522246-3755977927d7"),
    description:
      "A one-day programme for school and college teachers on using AI tools responsibly in the classroom. Sessions cover lesson planning, assessment design, academic integrity, and student data privacy, with time to build a lesson you can use the following week. Certificates of participation are issued.",
  },
  {
    name: "Material Futures Talk",
    category: "Design",
    location: "Workshop House, Gulberg II, Lahore",
    date: at(29, 18, 30),
    price: 25,
    capacity: 80,
    image: img("photo-1586717791821-3f44a563fa4c"),
    description:
      "Designers, engineers, and a textile scientist discuss regenerative materials — from mycelium packaging to recycled denim — and what it takes to move them from lab to factory floor. The talk is followed by a material library you can touch and a networking hour.",
  },
  {
    name: "The Local Table: Chefs & Growers Dinner",
    category: "Food",
    location: "Saffron Yard, Bahria Town, Lahore",
    date: at(31, 20, 0),
    price: 55,
    capacity: 40,
    image: img("photo-1414235077428-338989a2e8c0"),
    description:
      "A six-course seasonal dinner where every ingredient is introduced by the farmer who grew it and cooked by the chef who chose it. Wine-free pairings of house-made sodas and teas accompany each course. This dinner sells out every season; book early.",
  },
  {
    name: "Common Knowledge Night",
    category: "Community",
    location: "Quaid-e-Azam Library, Lahore",
    date: at(33, 18, 0),
    price: 0,
    capacity: 150,
    image: img("photo-1529156069898-49953e39b3ac"),
    description:
      "A social learning evening: six volunteers each teach something they know well in fifteen minutes — from reading a balance sheet to repairing a bicycle puncture. Stay after for tea and a chance to sign up as a future teacher. Free and open to all ages.",
  },
  {
    name: "Product Management Bootcamp",
    category: "Business",
    location: "Momentum Hub, DHA Phase 6, Lahore",
    date: at(36, 9, 30),
    price: 60,
    capacity: 35,
    image: img("photo-1552664730-d307ca884978"),
    description:
      "An intensive one-day bootcamp for engineers and analysts moving into product roles. Learn discovery interviews, prioritisation frameworks, writing PRDs, and how to run a useful sprint review — then apply each skill to a live case study. Small cohort; lunch included.",
  },
  {
    name: "Weekend Wellness Circle",
    category: "Wellness",
    location: "Bloom House, Model Town, Lahore",
    date: at(38, 10, 0),
    price: 15,
    capacity: 50,
    image: img("photo-1506126613408-eca07ce68773"),
    description:
      "A restorative Saturday morning of movement, breathwork, and open conversation about rest and burnout, hosted by two counsellors and a movement coach. Suitable for complete beginners. Tea and light snacks are served; wear comfortable clothing.",
  },
  {
    name: "Culture + Systems Expo",
    category: "Technology",
    location: "The Commons, Gulberg, Lahore",
    date: at(41, 10, 0),
    price: 42,
    capacity: 200,
    image: img("photo-1591115765373-5207764f72e7"),
    description:
      "A day of mixed-format sessions on how technology shapes culture — and the other way round. Panels on digital archives, creator economies, and open-source communities sit alongside demos from local studios. Ticket includes access to the evening showcase.",
  },
];

const past = [
  {
    name: "Spring Makers Fair",
    category: "Art",
    location: "Alhamra Arts Council, Mall Road, Lahore",
    date: at(-18, 11, 0),
    price: 12,
    capacity: 200,
    image: img("photo-1513364776144-60967b0f800f"),
    description:
      "A weekend market of independent makers with live demonstrations, kids' workshops, and a small food court. Over sixty stalls covered ceramics, textiles, print, and woodwork.",
    reviews: [
      { user: 0, rating: 5, comment: "Beautifully organised — every stall had a story and the workshops were hands-on and fun." },
      { user: 1, rating: 4, comment: "Great variety of makers. It got crowded by noon, but the volunteers kept things moving." },
      { user: 3, rating: 5, comment: "Took my kids to the print workshop and they still talk about it. Easy booking, clear directions." },
      { user: 4, rating: 4, comment: "Lovely atmosphere and fair prices. Would have liked more seating near the food stalls." },
    ],
  },
  {
    name: "Startup Stories Night",
    category: "Technology",
    location: "Arfa Software Technology Park, Lahore",
    date: at(-40, 18, 30),
    price: 0,
    capacity: 150,
    image: img("photo-1517245386807-bb43f82c33c4"),
    description:
      "Founders shared the honest, unpolished stories behind building companies from nothing — the pivots, the near-misses, and what they would do differently.",
    reviews: [
      { user: 1, rating: 4, comment: "Honest talks and a warm crowd. Booking took thirty seconds and check-in was seamless." },
      { user: 2, rating: 5, comment: "The best founder event I have attended in Lahore. Real stories, no sales pitches." },
      { user: 3, rating: 5, comment: "Left with three new contacts and a notebook full of ideas. The Q&A alone was worth it." },
    ],
  },
  {
    name: "Rooftop Jazz Evening",
    category: "Music",
    location: "The Nishat Hotel Rooftop, Lahore",
    date: at(-62, 20, 30),
    price: 30,
    capacity: 90,
    image: img("photo-1459749411175-04bf5292ceea"),
    description:
      "A quartet played two sets of standards and originals under open sky, with a short interval for dinner service and a view over the city.",
    reviews: [
      { user: 0, rating: 5, comment: "Perfect evening. The sound was excellent and the reminder notification meant we arrived on time." },
      { user: 2, rating: 4, comment: "Lovely setting and music. Seating was a little tight, but the atmosphere made up for it." },
      { user: 4, rating: 5, comment: "A rare kind of night in Lahore — great musicians, a calm crowd, and the city lights behind the stage." },
      { user: 7, rating: 5, comment: "Booked on a whim and it turned into the highlight of my month. The second set was magic." },
    ],
  },
  {
    name: "Design Systems Workshop",
    category: "Design",
    location: "Studio 04, DHA Phase 5, Lahore",
    date: at(-12, 10, 0),
    price: 35,
    capacity: 30,
    image: img("photo-1586717791821-3f44a563fa4c"),
    description:
      "A hands-on day building a component library from tokens up: naming, spacing scales, accessible colour, and documentation that people actually read.",
    reviews: [
      { user: 5, rating: 5, comment: "Small group, expert facilitators, and we left with a working Figma library. Worth every rupee." },
      { user: 6, rating: 4, comment: "Very practical. I would have liked more time on the documentation section, but the tokens part was excellent." },
      { user: 8, rating: 5, comment: "Finally understand why our team kept fighting over spacing. Clear, well-paced, and friendly." },
    ],
  },
  {
    name: "Street Food Walk: Old Lahore",
    category: "Food",
    location: "Gawalmandi Food Street, Lahore",
    date: at(-25, 19, 0),
    price: 20,
    capacity: 25,
    image: img("photo-1555939594-58d7cb561ad1"),
    description:
      "A guided evening through Gawalmandi's most loved stalls — nihari, kulfi, and the stories of the families who have run them for generations.",
    reviews: [
      { user: 1, rating: 5, comment: "Our guide knew every stall owner by name. Ate far too much and regretted nothing." },
      { user: 9, rating: 4, comment: "Great food and history. It ran a bit late, so plan for a long evening." },
      { user: 3, rating: 5, comment: "The kulfi stop alone was worth the ticket. Well organised and easy to find the meeting point." },
      { user: 6, rating: 5, comment: "Took visiting friends and they are still talking about it. Perfect intro to the city." },
    ],
  },
  {
    name: "Women in Tech Meetup",
    category: "Technology",
    location: "The Commons, Gulberg, Lahore",
    date: at(-33, 18, 0),
    price: 0,
    capacity: 100,
    image: img("photo-1515187029135-18ee286d815b"),
    description:
      "Lightning talks and open networking for women building software in Lahore — from first internships to founding teams.",
    reviews: [
      { user: 4, rating: 5, comment: "Welcoming, well-run, and I met two people I now work with. Please do this every quarter." },
      { user: 7, rating: 5, comment: "The lightning talks were sharp and the room was genuinely supportive. Free, but felt premium." },
      { user: 9, rating: 4, comment: "Great energy. The venue got warm with a full room, but the content was excellent." },
    ],
  },
  {
    name: "Mindful Mornings Retreat",
    category: "Wellness",
    location: "Bloom House, Model Town, Lahore",
    date: at(-50, 7, 30),
    price: 25,
    capacity: 40,
    image: img("photo-1506126613408-eca07ce68773"),
    description:
      "A half-day of guided meditation, gentle movement, and a shared breakfast, led by two counsellors and a movement coach.",
    reviews: [
      { user: 8, rating: 5, comment: "Came in stressed, left calm. The breakfast was lovely and the instructors were kind." },
      { user: 5, rating: 4, comment: "Peaceful morning. The meditation ran long for beginners, but the movement session was perfect." },
      { user: 0, rating: 5, comment: "Exactly what I needed. Booking and check-in were effortless." },
    ],
  },
  {
    name: "Community Clean-up & Picnic",
    category: "Community",
    location: "Jilani Park (Racecourse), Lahore",
    date: at(-70, 8, 0),
    price: 0,
    capacity: 150,
    image: img("photo-1529156069898-49953e39b3ac"),
    description:
      "Two hours of volunteering around the park followed by a shared picnic. Gloves, bags, and tea provided.",
    reviews: [
      { user: 2, rating: 5, comment: "Great turnout and a real sense of doing something together. My kids loved it." },
      { user: 6, rating: 4, comment: "Well organised. Could use more shade for the picnic, but a lovely morning." },
      { user: 1, rating: 5, comment: "Simple, joyful, and free. Met neighbours I had never spoken to." },
      { user: 8, rating: 5, comment: "Left the park cleaner than we found it and had a great breakfast. Sign me up for the next one." },
    ],
  },
  {
    name: "Photography Basics: Golden Hour",
    category: "Art",
    location: "Shalimar Gardens, Lahore",
    date: at(-8, 17, 0),
    price: 15,
    capacity: 20,
    image: img("photo-1460661419201-fd4cecdf8a8b"),
    description:
      "An outdoor session on composition, light, and manual settings, timed for the best hour of the day. Any camera — including your phone — is welcome.",
    reviews: [
      { user: 9, rating: 5, comment: "Learned more in two hours than in months of YouTube. The instructor reviewed everyone's shots." },
      { user: 3, rating: 4, comment: "Beautiful setting and practical tips. Bring water — it gets warm before the light turns." },
      { user: 7, rating: 5, comment: "My phone photos actually look intentional now. Small group made it easy to ask questions." },
    ],
  },
];

const withGallery = (event) => ({
  ...event,
  images: (galleries[event.category] || []).map(img),
});

module.exports = {
  upcoming: catalogue.map(withGallery),
  past: past.map(withGallery),
};

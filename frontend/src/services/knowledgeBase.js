import { extractKnowledgeQuery } from './voiceCommands.js';

export const knowledgeEntries = [
  { name: 'Dog', category: 'Living thing · animal', aliases: ['dog', 'dogs', 'puppy'], description: 'A dog is a domesticated mammal. Dogs have a strong sense of smell and are commonly kept as companions or working animals. Ask the handler before approaching an unfamiliar dog.' },
  { name: 'Cat', category: 'Living thing · animal', aliases: ['cat', 'cats', 'kitten'], description: 'A cat is a small domesticated mammal. Cats use whiskers and hearing to sense their surroundings, and many live as companions.' },
  { name: 'Cow', category: 'Living thing · animal', aliases: ['cow', 'cows', 'cattle'], description: 'A cow is a large domesticated mammal raised in many places for milk and as livestock. Cows need food, water, shelter, and care.' },
  { name: 'Bird', category: 'Living thing · animal', aliases: ['bird', 'birds'], description: 'Birds are warm-blooded animals with feathers, beaks, and wings. Many birds fly, while some species do not.' },
  { name: 'Bee', category: 'Living thing · animal', aliases: ['bee', 'bees', 'honeybee'], description: 'Bees are insects. Many bees pollinate flowering plants while collecting nectar and pollen. Give a bee space and avoid disturbing a nest.' },
  { name: 'Butterfly', category: 'Living thing · animal', aliases: ['butterfly', 'butterflies'], description: 'A butterfly is an insect with four large, often colourful wings. Butterflies develop through egg, caterpillar, chrysalis, and adult stages.' },
  { name: 'Lion', category: 'Living thing · animal', aliases: ['lion', 'lions'], description: 'A lion is a large wild cat native to parts of Africa and India. Lions are powerful wild animals and should only be observed from a safe, guided distance.' },
  { name: 'Elephant', category: 'Living thing · animal', aliases: ['elephant', 'elephants'], description: 'An elephant is a very large mammal with a trunk, tusks in some individuals, and broad ears. Elephants are wild animals; keep a safe distance.' },
  { name: 'Fish', category: 'Living thing · animal', aliases: ['fish'], description: 'Fish are aquatic animals that usually breathe through gills and move with fins. Different species live in freshwater or saltwater.' },
  { name: 'Tree', category: 'Living thing · plant', aliases: ['tree', 'trees'], description: 'A tree is a large, long-lived plant with a woody trunk and branches. Trees provide habitat and shade and can help protect soil and store carbon.' },
  { name: 'Flower', category: 'Living thing · plant', aliases: ['flower', 'flowers'], description: 'A flower is the reproductive part of many plants. Flowers can attract pollinators and later develop into seeds or fruit.' },
  { name: 'Grass', category: 'Living thing · plant', aliases: ['grass'], description: 'Grass is a family of plants with narrow leaves. It grows in many environments and provides food or ground cover for animals and people.' },
  { name: 'Mushroom', category: 'Living thing · fungus', aliases: ['mushroom', 'mushrooms', 'fungus', 'fungi'], description: 'A mushroom is the visible spore-producing part of some fungi. Some are edible and some are poisonous; never eat a wild mushroom unless an expert identifies it.' },
  { name: 'Water', category: 'Non-living thing · natural resource', aliases: ['water', 'fresh water', 'freshwater'], description: 'Water is a non-living substance essential to people, animals, and plants. Fresh water is limited in many places, so preventing waste and pollution helps protect it.' },
  { name: 'Air', category: 'Non-living thing · natural resource', aliases: ['air', 'atmosphere'], description: 'Air is a mixture of gases around Earth. People and many animals need oxygen from air, and plants use carbon dioxide during photosynthesis.' },
  { name: 'Sunlight', category: 'Non-living thing · natural resource', aliases: ['sunlight', 'sun light', 'sun'], description: 'Sunlight is energy from the Sun. It supports life on Earth, helps plants grow, and can be converted into electricity with solar technology. Avoid looking directly at the Sun.' },
  { name: 'Soil', category: 'Non-living thing · natural resource', aliases: ['soil', 'earth'], description: 'Soil is a mixture of mineral particles, organic matter, water, and air. Healthy soil supports plant growth and helps store and filter water.' },
  { name: 'Rock', category: 'Non-living thing · material', aliases: ['rock', 'rocks', 'stone', 'stones'], description: 'A rock is a naturally occurring solid made of one or more minerals. Rocks form, change, and break down through processes such as heat, pressure, and erosion.' },
  { name: 'Wind', category: 'Non-living thing · natural resource', aliases: ['wind'], description: 'Wind is moving air. Wind can help spread seeds and can generate electricity, but strong winds may create dangerous conditions.' },
  { name: 'Forest', category: 'Natural resource · ecosystem', aliases: ['forest', 'forests', 'woodland'], description: 'A forest is an ecosystem dominated by trees and other living things. Forests provide habitat, help protect watersheds, and supply materials; sustainable care helps keep them healthy.' },
  { name: 'Mineral', category: 'Natural resource · material', aliases: ['mineral', 'minerals'], description: 'A mineral is a naturally occurring solid with a characteristic chemical composition and crystal structure. Minerals are used in construction, tools, and electronics, so careful extraction matters.' },
  { name: 'Coal', category: 'Natural resource · fossil fuel', aliases: ['coal'], description: 'Coal is a carbon-rich fossil fuel formed from ancient plant material. Burning it produces energy and air pollution, including greenhouse gases.' },
  { name: 'Petroleum', category: 'Natural resource · fossil fuel', aliases: ['petroleum', 'oil', 'crude oil'], description: 'Petroleum is a liquid fossil fuel formed from ancient organic matter. It is used to make fuels and materials, but spills and combustion can harm ecosystems and the climate.' },
  { name: 'Natural gas', category: 'Natural resource · fossil fuel', aliases: ['natural gas', 'gas'], description: 'Natural gas is a fossil fuel made mostly of methane. It is used for energy, but leaks and burning it can contribute to climate change.' },
  { name: 'Sunflower', category: 'Living thing · plant', aliases: ['sunflower', 'sunflowers'], description: 'A sunflower is a flowering plant known for its large flower head and seeds. The seeds can be food for people and wildlife.' },
  { name: 'Mosquito', category: 'Living thing · animal', aliases: ['mosquito', 'mosquitoes'], description: 'A mosquito is a small flying insect. Some mosquitoes can spread disease, so use locally recommended protection and remove standing water where appropriate.' },
  { name: 'Human', category: 'Living thing · animal', aliases: ['human', 'person', 'people'], description: 'A human is a living mammal and member of the species Homo sapiens. People have varied bodies, experiences, and abilities.' },
  { name: 'Plastic', category: 'Non-living thing · material', aliases: ['plastic'], description: 'Plastic is a group of manufactured materials used in many products. Some plastics can be reused or recycled locally; litter and tiny plastic fragments can persist in the environment.' },
];

function normalize(value) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function findKnowledgeEntry(query) {
  const normalizedQuery = normalize(extractKnowledgeQuery(query));
  if (!normalizedQuery) return undefined;
  return knowledgeEntries
    .flatMap((entry) => entry.aliases.map((alias) => ({ entry, alias: normalize(alias) })))
    .filter(({ alias }) => normalizedQuery === alias || normalizedQuery.includes(` ${alias} `) || normalizedQuery.startsWith(`${alias} `))
    .sort((left, right) => right.alias.length - left.alias.length)[0]?.entry;
}

export function searchKnowledgeEntries(query) {
  const normalizedQuery = normalize(extractKnowledgeQuery(query));
  if (!normalizedQuery) return knowledgeEntries;
  return knowledgeEntries.filter((entry) => [entry.name, entry.category, ...entry.aliases]
    .some((value) => normalize(value).includes(normalizedQuery)));
}

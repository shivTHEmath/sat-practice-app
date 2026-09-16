/*
 * The source bank was extracted from documents whose visual reading order can
 * flatten a table into prose or split a caption across fields. Keep the small
 * set of verified repairs here so the client and the database seeder apply the
 * exact same canonical content.
 */
export const QUESTION_CONTENT_FIXES = {
  f8244f7c: {
    passage:
      "It has been hypothesized that since birds can dissipate excess heat through their bills, bill size should increase with habitat temperature. To evaluate this hypothesis for a 2021 study, Charlotte Probst and colleagues gathered data on mean bill surface area of species of North American thrashers (genus: Toxostoma) as well as on climate conditions of the birds’ native habitats. Based on their data, Probst and colleagues concluded that the hypothesis was not fully supported.",
    table_data: {
      caption: "North American Thrasher Mean Bill Size and Habitat Temperature Range",
      headers: [
        "Species",
        "Mean bill surface area (cm²)",
        "Mean maximum temperature of warmest month (°C)",
        "Mean minimum temperature of coldest month (°C)",
      ],
      rows: [
        ["Brown thrasher", "1.86", "30.40", "−4.29"],
        ["Bendire’s thrasher", "1.98", "36.57", "0.24"],
        ["Long-billed thrasher", "2.24", "35.27", "8.82"],
        ["Cozumel thrasher", "2.28", "33.27", "18.21"],
        ["Ocellated thrasher", "3.26", "27.56", "5.45"],
      ],
    },
  },
  "7c21b4b5": {
    passage:
      "A survey listed methods for signing into online accounts. Participants in different countries were asked to choose the sign-in method they view as most secure. The table presents data for two of the methods. According to the table, onetime passcodes were viewed as most secure by ______",
    table_data: {
      caption: "Survey Results for Two Online Account Sign-in Methods",
      headers: [
        "Sign-in method",
        "Percent of participants in the UK who chose method",
        "Percent of participants in Japan who chose method",
        "Percent of participants in India who chose method",
      ],
      rows: [
        ["Biometrics (for example, a face scan)", "33", "29", "22"],
        ["Onetime passcodes", "16", "8", "25"],
      ],
    },
  },
  e1546fd6: {
    passage:
      "After a volcanic eruption spilled lava into North Pacific Ocean waters, a dramatic increase of diatoms (a kind of phytoplankton) near the surface occurred. Scientists assumed the diatoms were thriving on nutrients such as phosphate from the lava, but analysis showed these nutrients weren’t present near the surface in forms diatoms can consume. However, there was an abundance of usable nitrate, a nutrient usually found in much deeper water and almost never found in lava. Microbial oceanographer Sonya Dyhrman and colleagues believe that as the lava plunged nearly 300 meters below the surface it dislodged pockets of this nutrient, releasing it to float upward, given that ______",
    table_data: {
      caption: "Average Nitrate and Phosphate Concentrations in Seawater after Volcanic Eruption",
      headers: [
        "Nutrient",
        "Lava-affected area, 5–45 m below surface",
        "Lava-affected area, 75–125 m below surface",
        "Outside lava-affected area, 5–45 m below surface",
        "Outside lava-affected area, 75–125 m below surface",
      ],
      rows: [
        ["Nitrate (micromoles per liter)", "3.1", "0.4", "≤0.03", "≤0.01"],
        ["Phosphate (micromoles per liter)", "0.17", "0.09", "0.14", "0.06"],
      ],
    },
  },
  "43f4013a": {
    passage:
      "The late Hemphillian (Hh) North American Land Mammal Age includes the subdivisions Hh3, 6.8 million years ago (Ma) to 6 Ma, and Hh4, 6 Ma to 4.75 Ma. While mammalian fossils have indicated that Florida’s Montbrook Fossil Site (MFS) and Palmetto Fauna of the Bone Valley Region (PFBV) date to Hh4, a more precise determination of the sites’ ages has proved challenging. Stephanie R. Killingsworth et al. compared average ratios of strontium-87 to strontium-86 (⁸⁷Sr/⁸⁶Sr) in fossil shark teeth from MFS and PFBV—0.709000 and 0.709028, respectively—to ⁸⁷Sr/⁸⁶Sr ratios in the global strontium seawater curve, a record that shows how ⁸⁷Sr/⁸⁶Sr ratios in seawater correspond to numerical ages and that is used to date fossils and, by extension, fossil sites. The researchers concluded that ______",
    choices: {
      A: "mammalian fossil evidence offers less dating precision than do ⁸⁷Sr/⁸⁶Sr ratios in fossil shark teeth and that PFBV likely was deposited closer to the Hh3-Hh4 boundary than was MFS.",
      B: "the average ⁸⁷Sr/⁸⁶Sr ratios in the fossil shark teeth from MFS and PFBV only partially support the site age estimates previously established through mammalian fossil evidence.",
      C: "the average ⁸⁷Sr/⁸⁶Sr ratios in the fossil shark teeth from MFS and PFBV resolve previous uncertainty about the sites’ relative ages by indicating that both sites were deposited contemporaneously during the late Hh.",
      D: "the average ⁸⁷Sr/⁸⁶Sr ratios in the fossil shark teeth from MFS and PFBV corroborate that both MFS and PFBV fall within Hh4 but suggest that PFBV was likely deposited more recently than MFS.",
    },
    table_data: {
      caption: "Global Strontium Seawater Curve",
      headers: ["⁸⁷Sr/⁸⁶Sr", "Age (Ma)"],
      rows: [
        ["0.708980", "6.20"],
        ["0.709000", "5.86"],
        ["0.709020", "5.40"],
        ["0.709040", "4.75"],
        ["0.709060", "3.00"],
      ],
    },
  },
  "35ec767c": {
    passage:
      "In Caddo, a language from what is now the US Southeast, vocabulary pertaining to corn cultivation resembles equivalent vocabulary in the Totozoquean language family in Mexico. This resemblance is perhaps attributable to cultural contact: such words could have entered Caddo through the intermediary of the neighboring but unrelated Chitimacha language, concurrent with the dissemination of corn itself from Mexico into the Southeast after 700 CE. That the vocabulary pertaining to domestic crops accompanies them as they diffuse into new regions is an established phenomenon globally. Crops may also be decoupled from vocabulary altogether: corn cultivation became ubiquitous among the Southeastern tribes, yet ______",
    table_data: {
      caption: "Corn-Related Vocabulary in Various Southeastern Languages",
      headers: [
        "Language family",
        "Word (language)",
        "English translation",
        "Proposed origin in vocabulary of the Totozoquean language family",
      ],
      rows: [
        ["Muskogean", "tanchi’ (Chickasaw); tanchi (Choctaw); vce (Muscogee, pronounced “uh-chi”)", "corn", "no"],
        ["Iroquoian", "se-lu (Cherokee)", "corn", "no"],
        ["Caddoan", "-k’as- (Caddo)", "dried corn", "yes"],
        ["Chitimacha", "k’asma (Chitimacha)", "corn", "yes"],
      ],
    },
  },
  ab94d40a: {
    passage:
      "Researchers recently conducted an experiment to understand how we use rankings to make decisions. They created a fictitious travel website describing five museums in London. Then, they invited two groups of participants, who had never visited the museums, to review the site and select the museum they would be most likely to visit. Meanwhile, the researchers tracked the amount of time each participant spent reading about each museum. For one group, the website ranked each museum, titling the page “The Top 5 Museums in London.” For the other group, the museums and their descriptions were not ranked. The researchers concluded that when reviewing ranked lists, we tend to focus on the top-ranked option.",
    table_data: {
      caption: "Time Participants Spent Reading about Five London Museums",
      headers: [
        "Museum name",
        "Ranking",
        "Percent of total reading time, participants provided with ranking",
        "Percent of total reading time, participants not provided with ranking",
      ],
      rows: [
        ["British Museum", "1", "36", "18"],
        ["National Gallery", "2", "21", "20"],
        ["Tate Modern", "4", "16", "17"],
        ["Victoria and Albert Museum", "5", "14", "23"],
        ["Natural History Museum", "3", "13", "22"],
      ],
    },
  },
  "4042ff0b": {
    passage:
      "Nan Gao and her team conducted multiple surveys to determine participants’ levels of comfort in a room where the temperature was regulated by a commercial climate control system. Participants filled out surveys several times a day to indicate their level of comfort on a scale from −3 (very cold) to +3 (very hot), with 0 indicating neutral (neither warm nor cool), and to indicate how they would prefer the temperature to be adjusted. The table shows three participants’ responses in one of the surveys. According to the table, all three participants wanted the room to be cooler, ______",
    table_data: {
      caption: "Comfort Ratings and Temperature-Adjustment Preferences from One Survey",
      headers: ["Participant", "Comfort rating", "Preferred temperature adjustment"],
      rows: [["20", "−2", "Cooler"], ["1", "1", "Cooler"], ["21", "1", "Cooler"]],
    },
  },
  "25b70215": {
    passage:
      "Researchers Carolina Laura Morales and Anna Traveset gathered data about flowering plants growing alongside each other in various locations. In each case, the researchers identified one plant as a “target species” and a nearby plant as a “neighboring species.” The researchers then calculated a positive or negative value to show how the neighboring species affected pollinator visits to the target species. One example of a neighboring species with a negative effect value is the ______",
    table_data: {
      caption: "Effect of Neighboring Species on Pollinator Visits to Target Species",
      headers: ["Neighboring species", "Target species", "Effect value"],
      rows: [["Virginia spring beauty", "star chickweed", "0.4853"], ["Himalayan balsam", "marsh woundwort", "0.7905"], ["common dandelion", "cat’s ear", "−0.6254"]],
    },
  },
  cbecb873: {
    table_data: {
      caption: "Body Length, Filter Time, and Lunges per Dive for Four Whale Species",
      headers: ["Whale species", "Typical adult body length (meters)", "Average time to filter all engulfed water (seconds)", "Average number of lunges per dive deeper than 50 meters"],
      rows: [["fin", "18–22", "31.30", "3.95"], ["humpback", "11–17", "17.12", "6.28"], ["minke", "7–10", "8.88", "7.48"], ["blue", "24–34", "60.27", "4.02"]],
    },
  },
  dd349efc: {
    passage:
      "Georgia Tech roboticists De’Aira Bryant and Ayanna Howard, along with ethicist Jason Borenstein, were interested in people’s perceptions of robots’ competence. They recruited participants and asked them how likely they think it is that a robot could do the work required in various occupations. Participants’ evaluations varied widely depending on which occupation was being considered; for example, ______",
    table_data: {
      caption: "Participants’ Evaluation of the Likelihood That Robots Can Work Effectively in Different Occupations",
      headers: ["Occupation", "Somewhat or very unlikely (%)", "Neutral (%)", "Somewhat or very likely (%)"],
      rows: [["television news anchor", "24", "9", "67"], ["teacher", "37", "16", "47"], ["firefighter", "62", "9", "30"], ["surgeon", "74", "9", "16"], ["tour guide", "10", "8", "82"]],
      note: "Rows may not add up to 100% due to rounding.",
    },
  },
  "629fb8a9": {
    passage:
      "A Pew Research Center survey conducted in January 2024 found that three out of ten US adults make at least one New Year’s resolution (a promise for the year ahead), while half of those who make a resolution make more than one. The survey asked participants what kinds of resolutions they made and separated them into several categories. The table presents percentages of people who make particular kinds of New Year’s resolutions among those who choose to make them, indexed by age bracket.",
    table_data: {
      caption: "Percentages of New Year’s Resolution Makers Who Make Certain Kinds of Resolutions",
      headers: ["Type of resolution", "Age 18–29", "Age 30–49", "Age 50–64", "Age 65+"],
      rows: [["Health and exercise", "79", "80", "79", "76"], ["Finances", "68", "63", "56", "47"], ["Personal relationships", "63", "53", "58", "52"], ["Hobbies", "65", "53", "51", "45"]],
    },
  },
  "2c06139b": {
    table_data: {
      caption: "Tadpole Body Mass and Toxin Production after Three Weeks in Ponds",
      headers: ["Population density", "Average tadpole body mass (milligrams)", "Average number of distinct bufadienolide toxins per tadpole", "Average amount of bufadienolide per tadpole (nanograms)", "Average bufadienolide concentration (nanograms per milligram of tadpole body mass)"],
      rows: [["High", "193.87", "22.69", "5,815.51", "374.22"], ["Medium", "254.56", "21.65", "5,525.72", "230.10"], ["Low", "258.97", "22.08", "4,664.99", "171.43"]],
    },
  },
  b2e54b50: {
    passage:
      "Researcher Xiaolu Jia and colleagues monitored individuals’ velocity and the surrounding crowd density as a group of study participants walked through a space and navigated around an obstacle. Participants rated how congested it seemed before the obstacle, after the obstacle, and overall, and the researchers correlated those ratings with velocity and density. (Correlations range from −1 to 1, with greater distance from 0 indicating greater strength.) The researchers concluded that the correlations with velocity are stronger than those with density.",
    table_data: {
      caption: "Correlations Between Congestion Ratings and Features of the Crowd in Raters’ Immediate Vicinity",
      headers: ["Crowd feature", "Before obstacle", "After obstacle", "Overall"],
      rows: [["Density", "0.8592", "0.7308", "0.7447"], ["Velocity", "−0.9357", "−0.9518", "−0.8587"]],
    },
  },
  "94c726fb": {
    passage:
      "While doing research for a paper about copper mining, a student finds a table with information about four different countries. The student notes that the country that mined 0.55 million metric tons of copper in 2020 had mined ______",
    table_data: {
      caption: "Millions of Metric Tons of Copper Mined in 1995 and 2020",
      headers: ["Country", "1995", "2020"],
      rows: [["Canada", "0.73", "0.59"], ["Indonesia", "0.44", "0.51"], ["Kazakhstan", "0.26", "0.55"], ["Chile", "2.49", "5.73"]],
    },
  },
  "0014477f": {
    passage:
      "There are nineteen Pueblo tribal nations in New Mexico. A student in a geography class is a citizen of Taos Pueblo in the northern part of the state. The student wants to compare the total area covered by Taos Pueblo with the total areas of various other Pueblo nations in the state. Looking at the table, the student finds that the total area of Taos Pueblo is 156.2 square miles, while the total area of Nambé Pueblo is ______",
    table_data: {
      caption: "Total Areas of Five Pueblo Nations in New Mexico",
      headers: ["Tribal nation", "Area (square miles)"],
      rows: [["Pueblo de San Ildefonso", "47.3"], ["Santa Clara Pueblo", "77.1"], ["Taos Pueblo", "156.2"], ["Nambé Pueblo", "32.4"], ["Pueblo of Acoma", "595.7"]],
    },
  },
  "56f477fb": {
    passage:
      "To assess the impact of invasive species on ecosystems in Africa, Benis N. Egoh and colleagues reviewed government reports from those nations about how invasive species are undermining ecosystem services (aspects of the ecosystem on which residents depend). The services were sorted into three categories: provisioning (material resources from the ecosystem), regulating (natural processes such as cleaning the air or water), and cultural (nonmaterial benefits of ecosystems). Egoh and her team assert that countries in each region reported effects on provisioning services and that provisioning services represent the majority of the reported services.",
    table_data: {
      caption: "Distribution of Ecosystem Services Affected by Invasive Species by Service Type",
      headers: ["Region", "Provisioning", "Regulating", "Cultural"],
      rows: [["Overall", "75%", "21%", "4%"], ["West", "73%", "27%", "0%"], ["North", "88%", "12%", "0%"], ["South", "79%", "14%", "7%"], ["East", "83%", "6%", "11%"], ["Central", "33%", "67%", "0%"]],
    },
  },
  "064c8999": {
    passage:
      "While researching a topic, a student has taken the following notes: The Haber-Bosch process is an industrial process used to manufacture ammonia (NH₃). It requires an iron catalyst and high temperatures and pressures. Most of the ammonia produced by this process is used in fertilizers. It was invented by chemists Fritz Haber and Carl Bosch in 1910. The process’s primary reaction combines nitrogen (N₂) from the air with hydrogen (H₂).",
    table_data: null,
  },
};

export function normalizeQuestion(question) {
  const fix = QUESTION_CONTENT_FIXES[question.id];
  const originalTable = question.table_data ?? question.table ?? null;
  if (!fix) return { ...question, table_data: originalTable };
  return {
    ...question,
    ...fix,
    choices: fix.choices || question.choices,
    table_data: Object.prototype.hasOwnProperty.call(fix, "table_data")
      ? fix.table_data
      : originalTable,
  };
}

export const quizLocations = [
  {
    id: "kitchen",
    name: "Future Food Kitchen", 
    coords: { lat: 52.455969591045005, lon:  13.523963941543776,},
    radius: 30,  

    features: {
      quiz: {
        file: "quiz_kitchen.json",
      },memory: true,
    },

    button: {
      label: "Future-Food-Quiz 🍽️",
      color: "#086159",
     
    },
    infoId: "kitchen", // InfoPlanes
  },


  {
    id: "algen", 
    name: "Gebäude A – Algenlabor",
     coords: { lat: 52.45788382109189, lon: 13.525577966020453 },
    radius: 30,

    features: {
      quiz: {
        file: "quiz_algen.json",
      },
      puzzle: {
        image: `${import.meta.env.BASE_URL}images/puzzle/algenpuzzle.jpg`,
      },
    },

    button: {
      label: "Algen-Quiz 🌱",
      color: "#29732d" 
    },
    infoId: "algen", // InfoPlane
  },


  {
    id: "quallen",
    name: "Bibliothek – Quallenlabor",
    coords: { lat:52.45529409001676, lon: 13.52487747220194  },
  
    radius: 30, 

    features: {
      quiz: {
        file: "quiz_quellen.json",
      },
    
    puzzle: {
      image: `${import.meta.env.BASE_URL}images/puzzle/qualle.png`, 
    },
  },

    button: {
      label: "Quallen-Quiz 🪼",
      color: "#369e9e",
    },
    infoId: "quallen",
  },


  {
    id: "salzpflanzen",
    name: "Gebäude C – Salzpflanzenlabor",
   
     coords: { lat: 52.455111227730356, lon:13.525546761324394  },  
    radius: 30,

    features: {
      quiz: {
        file: "quiz_salzpflanzen.json",
      },
    },

    button: {
      label: "Salzpflanzen-Quiz 🌿",
      color: "#75a839",
    },
    infoId: "salzpflanzen",
  },


  {
    id: "grillen",
    name: "Gebäude E – Grillenlabor",
    
   coords: { lat: 56.45639953688056, lon: 13.525978466276289 },
    radius: 30,

    features: {
      quiz: {
        file: "quiz_grillen.json",
      },
    },

    button: {
      label: "Grillen-Quiz 🦗",
      color: "#9c6225",
    },
    infoId: "grillen",
  },
];

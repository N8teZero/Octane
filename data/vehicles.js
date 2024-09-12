const starterVehicles = [
    { id: 0, year: 2010, make: 'Ford',   model: 'Fiesta',  stats: { speed: 50, acceleration: 50, handling: 40, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png' },
    { id: 1, year: 2011, make: 'Toyota', model: 'Corolla', stats: { speed: 60, acceleration: 40, handling: 50, fuelCapacity: 100, currentFuel: 100 }, image: './assets/corolla1.png' },
    { id: 2, year: 2009, make: 'Honda',  model: 'Civic',   stats: { speed: 55, acceleration: 45, handling: 45, fuelCapacity: 100, currentFuel: 100 }, image: './assets/civic1.png' }
];

const shopVehicles = [
    { id:1  ,level: 0 ,year: 1965 ,make: 'Ford'        ,model: 'Mustang'           ,stats: { speed: 75 , acceleration: 50 , handling: 58, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 30000  },
    { id:2  ,level: 0 ,year: 1988 ,make: 'BMW'         ,model: 'M3 Evolution II'   ,stats: { speed: 70 , acceleration: 46 , handling: 64, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 30000  },
    { id:3  ,level: 0 ,year: 1996 ,make: 'Nissan'      ,model: '180sx Type X'      ,stats: { speed: 73 , acceleration: 44 , handling: 60, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 30000  },
    { id:4  ,level: 0 ,year: 1994 ,make: 'Toyota'      ,model: 'Supra'             ,stats: { speed: 150, acceleration: 100, handling: 60, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 50000  },
    { id:5  ,level: 0 ,year: 2001 ,make: 'Nissan'      ,model: 'Silvia S15'        ,stats: { speed: 146, acceleration: 73 , handling: 30, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 40000  },
    { id:6  ,level: 0 ,year: 2000 ,make: 'Mazda'       ,model: 'RX-7'              ,stats: { speed: 145, acceleration: 58 , handling: 65, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 44000  },
    { id:7  ,level: 0 ,year: 2004 ,make: 'Mitsubishi'  ,model: 'Lancer Evolution'  ,stats: { speed: 148, acceleration: 70 , handling: 68, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 66000  },
    { id:8  ,level: 0 ,year: 2019 ,make: 'Chevrolet'   ,model: 'Corvette'          ,stats: { speed: 180, acceleration: 48 , handling: 52, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 69000  },
    { id:9  ,level: 0 ,year: 2005 ,make: 'Subaru'      ,model: 'Impreza WRX STI'   ,stats: { speed: 160, acceleration: 70 , handling: 70, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 73000  },
    { id:10 ,level: 0 ,year: 2010 ,make: 'BMW'         ,model: 'M3'                ,stats: { speed: 155, acceleration: 86 , handling: 81, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: false, price: 65000  },
    { id:11 ,level: 0 ,year: 2019 ,make: 'Ford'        ,model: 'Mustang GT'        ,stats: { speed: 120, acceleration: 90 , handling: 50, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 60000  },
    { id:12 ,level: 0 ,year: 2011 ,make: 'Chevrolet'   ,model: 'Camaro SS'         ,stats: { speed: 180, acceleration: 48 , handling: 52, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 85000  },
    { id:13 ,level: 0 ,year: 2010 ,make: 'Audi'        ,model: 'R8'                ,stats: { speed: 185, acceleration: 69 , handling: 61, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: false, price: 110000 },
    { id:14 ,level: 0 ,year: 2023 ,make: 'Dodge'       ,model: 'Challenger SRT'    ,stats: { speed: 150, acceleration: 80 , handling: 60, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 89000  },
    { id:15 ,level: 0 ,year: 2019 ,make: 'Honda'       ,model: 'Civic Type R'      ,stats: { speed: 165, acceleration: 62 , handling: 88, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: true,  price: 92000  },
    { id:16 ,level: 0 ,year: 2008 ,make: 'Porsche'     ,model: '911 GT3 RS'        ,stats: { speed: 110, acceleration: 75 , handling: 95, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: false, price: 120000 },
    { id:17 ,level: 0 ,year: 2013 ,make: 'Lamborghini' ,model: 'Huracan'           ,stats: { speed: 190, acceleration: 90 , handling: 80, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: false, price: 125000 },
    { id:18 ,level: 0 ,year: 2016 ,make: 'Ferrari'     ,model: '488 GTB'           ,stats: { speed: 190, acceleration: 120, handling: 85, fuelCapacity: 100, currentFuel: 100 }, image: './assets/placeholder.png',  forsale: false, price: 130000 }
];

const aiRaces = [
    { id:1  , level: 1,  year: 1999, make: 'Toyota',      model: 'Celica',            stats: { speed: 50,  acceleration: 40,  handling: 35 }, image: null,  enabled: true,  reward: 30000  },
    { id:2  , level: 2,  year: 1965, make: 'Ford',        model: 'Mustang',           stats: { speed: 75,  acceleration: 50,  handling: 58 }, image: null,  enabled: true,  reward: 30000  },
    { id:3  , level: 3,  year: 1988, make: 'BMW',         model: 'M3 Evolution II',   stats: { speed: 70,  acceleration: 46,  handling: 64 }, image: null,  enabled: true,  reward: 30000  },
    { id:4  , level: 4,  year: 1996, make: 'Nissan',      model: '180sx Type X',      stats: { speed: 73,  acceleration: 44,  handling: 60 }, image: null,  enabled: true,  reward: 30000  },
    { id:5  , level: 5,  year: 1994, make: 'Toyota',      model: 'Supra',             stats: { speed: 150, acceleration: 100, handling: 60 }, image: null,  enabled: true,  reward: 50000  },
    { id:6  , level: 6,  year: 2001, make: 'Nissan',      model: 'Silvia S15',        stats: { speed: 146, acceleration: 73,  handling: 30 }, image: null,  enabled: true,  reward: 40000  },
    { id:7  , level: 7,  year: 2000, make: 'Mazda',       model: 'RX-7',              stats: { speed: 145, acceleration: 58,  handling: 65 }, image: null,  enabled: true,  reward: 44000  },
    { id:8  , level: 8,  year: 2004, make: 'Mitsubishi',  model: 'Lancer Evolution',  stats: { speed: 148, acceleration: 70,  handling: 68 }, image: null,  enabled: true,  reward: 66000  },
    { id:9  , level: 9,  year: 2019, make: 'Chevrolet',   model: 'Corvette',          stats: { speed: 180, acceleration: 48,  handling: 52 }, image: null,  enabled: true,  reward: 69000  },
    { id:10 , level: 10, year: 2005, make: 'Subaru',      model: 'Impreza WRX STI',   stats: { speed: 160, acceleration: 70,  handling: 70 }, image: null,  enabled: true,  reward: 73000  },
    { id:11 , level: 11, year: 2010, make: 'BMW',         model: 'M3',                stats: { speed: 155, acceleration: 86,  handling: 81 }, image: null,  enabled: true,  reward: 65000  },
    { id:12 , level: 12, year: 2019, make: 'Ford',        model: 'Mustang GT',        stats: { speed: 120, acceleration: 90,  handling: 50 }, image: null,  enabled: true,  reward: 60000  },
    { id:13 , level: 13, year: 2011, make: 'Chevrolet',   model: 'Camaro SS',         stats: { speed: 180, acceleration: 48,  handling: 52 }, image: null,  enabled: true,  reward: 85000  },
    { id:14 , level: 14, year: 2010, make: 'Audi',        model: 'R8',                stats: { speed: 185, acceleration: 69,  handling: 61 }, image: null,  enabled: true,  reward: 110000 },
    { id:15 , level: 15, year: 2023, make: 'Dodge',       model: 'Challenger SRT',    stats: { speed: 150, acceleration: 80,  handling: 60 }, image: null,  enabled: true,  reward: 89000  },
    { id:16 , level: 16, year: 2019, make: 'Honda',       model: 'Civic Type R',      stats: { speed: 165, acceleration: 62,  handling: 88 }, image: null,  enabled: true,  reward: 92000  },
    { id:17 , level: 17, year: 2008, make: 'Porsche',     model: '911 GT3 RS',        stats: { speed: 110, acceleration: 75,  handling: 95 }, image: null,  enabled: true,  reward: 120000 },
    { id:18 , level: 18, year: 2013, make: 'Lamborghini', model: 'Huracan',           stats: { speed: 190, acceleration: 90,  handling: 80 }, image: null,  enabled: true,  reward: 125000 },
    { id:19 , level: 19, year: 2016, make: 'Ferrari',     model: '488 GTB',           stats: { speed: 190, acceleration: 120, handling: 85 }, image: null,  enabled: true,  reward: 130000 }
];

module.exports = { shopVehicles, aiRaces, starterVehicles };
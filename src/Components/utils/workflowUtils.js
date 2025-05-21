// Полные workflow по воронкам
export const workflowOptionsSalesMD = [
    "Interesat",
    "Apel de intrare",
    "De prelucrat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract semnat",
    "Plată primită",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

export const workflowOptionsSalesRO = [
    "Interesat",
    "De prelucrat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Factura trimisă",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

export const workflowOptionsFiliale = [
    "Interesat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

export const workflowOptionsAgency = [
    "Contactate",
    "In procesare",
    "Contract",
    "Creat Cont In sistem",
    "Rezervari",
];

export const workflowOptionsGreenCard = [
    "В работе GC",
    "Сбор данных",
    "КУПИЛИ (предыдущие года)",
    "Купил (текущий год)",
    "Rezervari",
];

export const workflowOptionsIndividualsGroups = [
    "Interesat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

export const workflowOptionsBusinessGroups = [
    "Interesat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

export const workflowOptionsFranchiseOrhei = [
    "Interesat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

export const workflowOptionsFranchiseCantemir = [
    "Interesat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
    "Realizat cu succes",
    "Închis și nerealizat"
];

// Урезанные workflow по воронкам
export const workflowOptionsLimitedSalesMD = [
    "Apel de intrare",
    "De prelucrat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract semnat",
    "Plată primită",
    "Contract încheiat"
];

export const workflowOptionsLimitedSalesRO = [
    "De prelucrat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Factura trimisă",
    "Contract încheiat"
];

export const workflowOptionsLimitedFiliale = [
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat"
];

export const workflowOptionsLimitedAgency = [
    "Contactate",
    "In procesare",
    "Contract",
    "Creat Cont In sistem",
    "Rezervari",
];

export const workflowOptionsLimitedGreenCard = [
    "В работе GC",
    "Сбор данных",
    "КУПИЛИ (предыдущие года)",
    "Купил (текущий год)",
    "Rezervari",
];
export const workflowOptionsLimitedIndividualsGroups = [
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
];

export const workflowOptionsLimitedBusinessGroups = [
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
];

export const workflowOptionsLimitedFranchiseOrhei = [
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
];

export const workflowOptionsLimitedFranchiseCantemir = [
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract încheiat",
];

// Мапа: groupTitle → workflow (для админа)
export const workflowOptionsByGroupTitle = {
    MD: workflowOptionsSalesMD,
    RO: workflowOptionsSalesRO,
    Filiale: workflowOptionsFiliale,
    Agency: workflowOptionsAgency,
    GreenCard: workflowOptionsGreenCard,
    IndividualGroups: workflowOptionsIndividualsGroups,
    BusinessGroups: workflowOptionsBusinessGroups,
    FranchiseOrhei: workflowOptionsFranchiseOrhei,
    FranchiseCantemir: workflowOptionsFranchiseCantemir,
    Default: workflowOptionsSalesMD,
};

// Мапа: groupTitle → урезанный workflow
export const workflowOptionsLimitedByGroupTitle = {
    MD: workflowOptionsLimitedSalesMD,
    RO: workflowOptionsLimitedSalesRO,
    Filiale: workflowOptionsLimitedFiliale,
    Agency: workflowOptionsLimitedAgency,
    GreenCard: workflowOptionsLimitedGreenCard,
    IndividualGroups: workflowOptionsLimitedIndividualsGroups,
    BusinessGroups: workflowOptionsLimitedBusinessGroups,
    FranchiseOrhei: workflowOptionsLimitedFranchiseOrhei,
    FranchiseCantemir: workflowOptionsLimitedFranchiseCantemir,
    Default: workflowOptionsLimitedSalesMD,
};

// Мапа: название группы пользователя → groupTitle
export const userGroupsToGroupTitle = {
    "Admin": ["MD", "RO", "GreenCard", "Filiale", "FranchiseCantemir", "FranchiseOrhei", "BusinessGroups", "IndividualGroups", "GreenCard", "Agency"],
    "Front Office": ["MD"],
    "Back MD": ["MD", "RO", "GreenCard"],
    "Back Flagman": ["MD", "RO", "GreenCard"],
    "Back Headline": ["MD", "RO", "GreenCard"],

    // RO
    "Call Centre RO": ["RO"],
    "Bucharest RO": ["RO"],
    "Brasov RO": ["RO"],
    "Iasi RO": ["RO"],

    // другие
    "Company branches": ["Filiale"],
    "Franchise Cantemir": ["FranchiseCantemir"],
    "Franchise Orhei": ["FranchiseOrhei"],
    "Corporate sales": ["BusinessGroups", "IndividualGroups"],
    "Private sales": ["IndividualGroups"],
    "Green Card": ["GreenCard"],
    "Agency": ["Agency"],
};


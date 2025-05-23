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

export const workflowOptionsIndividualGroups = [
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

export const workflowOptionsFranchise = [
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

////////////////////////////////////////////////
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
export const workflowOptionsLimitedIndividualGroups = [
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

export const workflowOptionsByGroupTitle = {
    MD: workflowOptionsSalesMD,
    RO: workflowOptionsSalesRO,
    Filiale: workflowOptionsFiliale,
    Agency: workflowOptionsAgency,
    GreenCard: workflowOptionsGreenCard,
    IndividualGroups: workflowOptionsIndividualGroups,
    BusinessGroups: workflowOptionsBusinessGroups,
    FranchiseOrhei: workflowOptionsFranchiseOrhei,
    FranchiseCantemir: workflowOptionsFranchiseCantemir,
    Default: workflowOptionsSalesMD,
};

export const workflowOptionsLimitedByGroupTitle = {
    MD: workflowOptionsLimitedSalesMD,
    RO: workflowOptionsLimitedSalesRO,
    Filiale: workflowOptionsLimitedFiliale,
    Agency: workflowOptionsLimitedAgency,
    GreenCard: workflowOptionsLimitedGreenCard,
    IndividualGroups: workflowOptionsLimitedIndividualGroups,
    BusinessGroups: workflowOptionsLimitedBusinessGroups,
    FranchiseOrhei: workflowOptionsLimitedFranchiseOrhei,
    FranchiseCantemir: workflowOptionsLimitedFranchiseCantemir,
    Default: workflowOptionsLimitedSalesMD,
};

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

    // other
    "Company branches": ["Filiale"],
    "Franchise Cantemir": ["FranchiseCantemir"],
    "Franchise Orhei": ["FranchiseOrhei"],
    "Corporate sales": ["BusinessGroups", "IndividualGroups"],
    "Private sales": ["IndividualGroups"],
    "Green Card": ["GreenCard"],
    "Agency": ["Agency"],
};

export const groupTitleOptions = [
    { value: "MD", label: "MD-Sales" },
    { value: "RO", label: "RO-Sales" },
    { value: "Filiale", label: "Filiale" },
    { value: "Franchise", label: "Francize" },
    { value: "FranchiseOrhei", label: "Franchise Orhei" },
    { value: "FranchiseCantemir", label: "Franchise Cantemir" },
    { value: "Marketing", label: "Marketing" },
    { value: "IndividualGroups", label: "Individual groups" },
    { value: "BusinessGroups", label: "Business groups" },
    { value: "Agency", label: "Agency" },
    { value: "GreenCard", label: "Green Card" },
];

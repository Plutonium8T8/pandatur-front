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

// Урезанные workflow по воронкам
export const workflowOptionsLimitedSalesMD = [
    "Apel de intrare",
    "De prelucrat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Contract semnat",
    "Plată primită",
    "Contract încheiat",
];

export const workflowOptionsLimitedSalesRO = [
    "De prelucrat",
    "Luat în lucru",
    "Ofertă trimisă",
    "Aprobat cu client",
    "Factura trimisă",
    "Contract încheiat",
];

// Мапа: groupTitle → workflow (для админа)
export const workflowOptionsByGroupTitle = {
    MD: workflowOptionsSalesMD,
    RO: workflowOptionsSalesRO,
    Default: workflowOptionsSalesRO,
};

// Мапа: groupTitle → урезанный workflow
export const workflowOptionsLimitedByGroupTitle = {
    MD: workflowOptionsLimitedSalesMD,
    RO: workflowOptionsLimitedSalesRO,
    Default: workflowOptionsLimitedSalesRO,
};

// Мапа: название группы пользователя → groupTitle
export const userGroupsToGroupTitle = {
    "Admin": "RO",
    "Call Centre RO": "RO",
    "Bucharest RO": "RO",
    "Brasov RO": "RO",
    "Iasi RO": "RO",
    "Back MD": "MD",
    "Back Flagman": "MD",
    "Back Headline": "MD",
    // Добавь другие по необходимости
};

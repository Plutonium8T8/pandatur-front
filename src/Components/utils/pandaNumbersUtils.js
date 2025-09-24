// Все доступные номера панды
export const PANDA_NUMBERS = [
  { value: "37360991919", label: "37360991919 - Panda Tur Moldova" },
  { value: "40720949119", label: "40720949119 - Panda Tur Iasi (Romania)" },
  { value: "40728932931", label: "40728932931 - Panda Tur Bucuresti (Romania)" },
  { value: "40721205105", label: "40721205105 - Panda Tur Brasov (Romania)" },
];

/**
 * Фильтрует номера панды по воронке (group_title)
 * @param {string} groupTitle - Название воронки
 * @param {string} platform - Платформа (whatsapp, viber, telegram)
 * @returns {Array} Отфильтрованный массив номеров панды
 */
export const getPandaNumbersByGroupTitle = (groupTitle, platform = 'whatsapp') => {
  if (!groupTitle) {
    return PANDA_NUMBERS; // Для всех остальных случаев - показать все номера
  }

  const groupTitleUpper = groupTitle.toUpperCase();

  // Для MD воронки - показать только MD номер
  if (groupTitleUpper.includes('MD') || groupTitleUpper.includes('RASCANI')) {
    return PANDA_NUMBERS.filter(num => num.value === "37360991919");
  }

  if (groupTitleUpper.includes('RO')) {
    // Для RO воронки - показать только RO номера
    return PANDA_NUMBERS.filter(num => num.value !== "37360991919");
  }

  // Для всех остальных случаев - показать все номера
  return PANDA_NUMBERS;
};

/**
 * Получает MD номер панды
 * @returns {Object} MD номер панды
 */
export const getMDPandaNumber = () => {
  return PANDA_NUMBERS.find(num => num.value === "37360991919");
};

/**
 * Получает все RO номера панды
 * @returns {Array} Массив RO номеров панды
 */
export const getROPandaNumbers = () => {
  return PANDA_NUMBERS.filter(num => num.value !== "37360991919");
};

/**
 * Проверяет, является ли номер MD номером
 * @param {string} number - Номер для проверки
 * @returns {boolean} true если это MD номер
 */
export const isMDPandaNumber = (number) => {
  return number === "37360991919";
};

/**
 * Проверяет, является ли номер RO номером
 * @param {string} number - Номер для проверки
 * @returns {boolean} true если это RO номер
 */
export const isROPandaNumber = (number) => {
  return number !== "37360991919" && PANDA_NUMBERS.some(num => num.value === number);
};

import { capitalizeFirstLetter } from "./capitalizeFirstLetter";
import { getFullName } from "./getFullName";

export const normalizeUsersAndPlatforms = (list, messages) => {
  const users = list?.map(({ id, name, surname, phone }) => {
    const platformsMessagesClient = messages
      .filter((msg) => msg.client_id === id)
      .map(({ platform }) => platform);
    return [...new Set(platformsMessagesClient)].map((platform) => ({
      value: `${id}-${platform}`,
      label: `${getFullName(name, surname) || `#${id}`} - ${capitalizeFirstLetter(platform)}`,
      payload: { id, platform, name, surname, phone },
    }));
  });
  return users ? users.flat() : [];
};

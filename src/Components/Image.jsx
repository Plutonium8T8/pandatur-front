import { useState, useEffect } from "react";
import { Image as MantineImage, Flex, Text } from "@mantine/core";
import { IoWarningOutline } from "react-icons/io5";
import { getLanguageByKey } from "@utils";
import { baseAxios } from "@api";

const BROKEN_PHOTO = "/broken.png";

const fallbackImage = (fallback) => {
  if (fallback) {
    return fallback();
  }

  return (
    <Flex c="red" direction="column">
      <Flex align="center" gap="8">
        <Flex>
          <IoWarningOutline size={16} />
        </Flex>
        <Text size="xs">{getLanguageByKey("failToLoadImage")}</Text>
      </Flex>
    </Flex>
  );
};

const content = (renderImage, url) => {
  if (renderImage) {
    return renderImage();
  }

  return (
    <MantineImage
      fallbackSrc={BROKEN_PHOTO}
      my="5"
      radius="md"
      src={url}
      className="pointer"
      onClick={() => {
        window.open(url, "_blank");
      }}
    />
  );
};

export const Image = ({ url, renderImage, renderFallbackImage }) => {
  const [imageUrl, setImageUrl] = useState();

  useEffect(() => {
    const getImageUrl = async (url) => {
      try {
        const response = await baseAxios.get(url);

        if (response.ok) {
          setImageUrl(url);
        } else {
          setImageUrl(null);
        }
      } catch (error) {
        setImageUrl(null);
      }
    };

    if (url) {
      getImageUrl(url);
    }
  }, []);

  return (
    <>
      {!imageUrl && fallbackImage(renderFallbackImage)}
      {imageUrl && content(renderImage, imageUrl)}
    </>
  );
};

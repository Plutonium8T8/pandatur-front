import { useState, useEffect } from "react";
import { Image as MantineImage, Flex, Text, Skeleton } from "@mantine/core";
import { IoWarningOutline } from "react-icons/io5";
import { getLanguageByKey } from "@utils";

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
      onClick={() => window.open(url, "_blank")}
    />
  );
};

export const Image = ({ url, renderImage, renderFallbackImage, style }) => {
  const [imageUrl, setImageUrl] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!url) return;

    setIsLoading(true);
    setImageLoaded(false);
    
    const img = new window.Image();
    img.src = url;

    img.onload = () => {
      setImageUrl(url);
      setIsLoading(false);
      // Small delay for smooth fade-in effect
      setTimeout(() => setImageLoaded(true), 50);
    };
    
    img.onerror = () => {
      setImageUrl(null);
      setIsLoading(false);
    };
  }, [url]);

  const fallback = fallbackImage(renderFallbackImage);
  
  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <Skeleton 
        height={style?.maxHeight || 300} 
        width={style?.maxWidth || 500}
        radius="md"
        style={{ 
          ...style,
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      />
    );
  }
  
  const rendered = renderImage ? renderImage() : (
    <MantineImage
      fallbackSrc={BROKEN_PHOTO}
      my="5"
      radius="md"
      src={imageUrl}
      style={{
        ...style,
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
      className="pointer"
      onClick={() => window.open(imageUrl, "_blank")}
    />
  );

  return <>{imageUrl ? rendered : fallback}</>;
};
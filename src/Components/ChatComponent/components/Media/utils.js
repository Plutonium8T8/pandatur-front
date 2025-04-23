import { Link } from "react-router-dom";
import { GoTrash } from "react-icons/go";
import { FaRegFileLines } from "react-icons/fa6";
import {
  Flex,
  Image,
  Box,
  ActionIcon,
  Text,
  Divider,
  Grid,
} from "@mantine/core";
import dayjs from "dayjs";
import {
  FALLBACK_IMAGE,
  MEDIA_TYPE,
  DD_MM_YYYY,
  HH_mm,
} from "../../../../app-constants";
import { getLanguageByKey, parseServerDate } from "../../../utils";
import { Audio } from "../../../Audio";
import { TimeClient } from "./TimeClient";
import { Empty } from "../../../Empty";
import "./Media.css";
/**
 * @typedef {Object} Params
 * @property {string} type
 * @property {string} message
 * @property {number} id
 * @property {boolean} shouldDelete
 * @property {string} string
 * @property {() => void} deleteAttachment
 */

/**
 * @param {Params} param
 */
export const renderMediaContent = ({
  type,
  message,
  id,
  shouldDelete,
  msjTime,
  deleteAttachment,
  payload,
}) => {
  const MEDIA_CONTENT = {
    [MEDIA_TYPE.IMAGE]: (
      <Box
        w="100%"
        h="100%"
        className="media-wrapper media-files"
        pos="relative"
      >
        {shouldDelete && (
          <Box
            className="media-wrapper-delete-btn"
            bg="white"
            right="4px"
            top="4px"
            pos="absolute"
          >
            <ActionIcon
              size="md"
              onClick={() => deleteAttachment(id)}
              variant="danger"
            >
              <GoTrash size={14} />
            </ActionIcon>
          </Box>
        )}
        <Image
          fit="contain"
          h="100px"
          radius="md"
          src={message}
          fallbackSrc={FALLBACK_IMAGE}
          onClick={() => {
            window.open(message, "_blank");
          }}
        />
      </Box>
    ),
    [MEDIA_TYPE.VIDEO]: (
      <Flex className="media-wrapper" pos="relative">
        {shouldDelete && (
          <Box
            pos="absolute"
            className="media-wrapper-delete-btn"
            bg="white"
            right="10px"
            top="10px"
          >
            <ActionIcon
              size="md"
              onClick={() => deleteAttachment(id)}
              variant="danger"
            >
              <GoTrash size={14} />
            </ActionIcon>
          </Box>
        )}
        <video controls className="video-preview">
          <source src={message} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      </Flex>
    ),
    [MEDIA_TYPE.AUDIO]: (
      <Flex
        align="center"
        justify="space-between"
        w="100%"
        className="media-wrapper"
      >
        <Flex direction="column" gap="4">
          <Audio src={message} />

          <TimeClient
            id={payload?.client_id}
            date={parseServerDate(msjTime)?.format(`${DD_MM_YYYY} ${HH_mm}`)}
          />
        </Flex>

        {shouldDelete && (
          <ActionIcon
            size="md"
            onClick={() => deleteAttachment(id)}
            variant="danger"
          >
            <GoTrash size={14} />
          </ActionIcon>
        )}
      </Flex>
    ),
    [MEDIA_TYPE.FILE]: (
      <Flex
        align="center"
        justify="space-between"
        w="100%"
        className="media-wrapper"
      >
        <Flex>
          <Link className="file-link" to={message} target="_blank">
            <Flex gap="xs" align="center" p={8}>
              <FaRegFileLines size={32} />
              <Flex direction="column" gap="4">
                <Text>{`${message?.slice(0, 45)}...`}</Text>

                <TimeClient
                  id={payload?.client_id}
                  date={parseServerDate(msjTime)?.format(
                    `${DD_MM_YYYY} ${HH_mm}`,
                  )}
                />
              </Flex>
            </Flex>
          </Link>
        </Flex>

        {shouldDelete && (
          <ActionIcon
            size="md"
            onClick={() => deleteAttachment(id)}
            variant="danger"
          >
            <GoTrash size={14} />
          </ActionIcon>
        )}
      </Flex>
    ),
    [MEDIA_TYPE.CALL]: (
      <Flex gap="4" direction="column">
        <Audio src={message} />

        {!shouldDelete && (
          <TimeClient
            id={payload?.client_id}
            date={dayjs(msjTime).format(`${DD_MM_YYYY} ${HH_mm}`)}
          />
        )}
      </Flex>
    ),
  };

  return MEDIA_CONTENT[type];
};

export const renderFile = (media, deleteAttachment, shouldDelete) => {
  const filterMediaByImageAndVideo = media.filter((i) =>
    [MEDIA_TYPE.FILE].includes(i.mtype),
  );

  return (
    <>
      {filterMediaByImageAndVideo.length ? (
        filterMediaByImageAndVideo.map((media, index) => (
          <Flex direction="column" align="center" key={media.id}>
            {index === 0 && <Divider w="100%" />}
            {renderMediaContent({
              type: media.mtype,
              message: media.url || media.message,
              id: media.id,
              deleteAttachment: () => deleteAttachment(media.id),
              shouldDelete,
              msjTime: media.time_sent,
              payload: media,
            })}

            <Divider w="100%" />
          </Flex>
        ))
      ) : (
        <Flex h="100%" align="center" justify="center">
          <Empty />
        </Flex>
      )}
    </>
  );
};

export const renderMedia = (media, deleteAttachment, shouldDelete) => {
  const filterMediaByImageAndVideo = media.filter((i) =>
    [MEDIA_TYPE.VIDEO, MEDIA_TYPE.IMAGE].includes(i.mtype),
  );

  return (
    <>
      {filterMediaByImageAndVideo.length ? (
        <Grid gutter="1px">
          {filterMediaByImageAndVideo.map((media) => (
            <Grid.Col span={4} key={media.id}>
              {renderMediaContent({
                type: media.mtype,
                message: media.url,
                id: media.id,
                deleteAttachment: () => deleteAttachment(media.id),
                shouldDelete,
              })}
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Empty />
      )}
    </>
  );
};

export const renderCall = (media, deleteAttachment, shouldDelete) => {
  const filterMediaByCallAndAudio = media.filter((i) =>
    [MEDIA_TYPE.CALL, MEDIA_TYPE.AUDIO].includes(i.mtype),
  );

  return (
    <>
      {filterMediaByCallAndAudio.length ? (
        filterMediaByCallAndAudio.map((media, index) => (
          <Flex w="100%" direction="column" key={media.id}>
            {index === 0 && <Divider w="100%" />}
            <Box py="md">
              {renderMediaContent({
                type: media.mtype,
                message: media.url,
                id: media.id,
                deleteAttachment: () => deleteAttachment(media.id),
                shouldDelete,
                msjTime: media.time_sent,
              })}
            </Box>

            <Divider w="100%" />
          </Flex>
        ))
      ) : (
        <Empty />
      )}
    </>
  );
};

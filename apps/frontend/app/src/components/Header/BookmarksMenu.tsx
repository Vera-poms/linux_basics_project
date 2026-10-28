import { Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import type { Lab } from "../../data/types";
import { useBookmarks, type Bookmark } from "../../state/BookmarksContext";

interface BookmarksMenuProps {
  labs: Lab[];
  onSelect: (bookmark: Bookmark) => void;
}

export default function BookmarksMenu({ labs, onSelect }: BookmarksMenuProps) {
  const { bookmarks } = useBookmarks();
  const labIndex = new Map(labs.map((l, i) => [l.id, i]));
  const sorted = [...bookmarks].sort((a, b) => (labIndex.get(a.lab) ?? 0) - (labIndex.get(b.lab) ?? 0));

  return (
    <Menu isLazy placement="bottom-end">
      <MenuButton as={Text} cursor="pointer" fontFamily="mono" fontSize="0.72rem" color="#7e909d" _hover={{ color: "lb.prompt" }}>
        bookmarks ({bookmarks.length})
      </MenuButton>
      <MenuList maxH="60vh" overflowY="auto" fontSize="0.85rem" zIndex={20}>
        {sorted.length === 0 && (
          <Text px="0.9rem" py="0.4rem" color="gray.500" maxW="22rem">
            Nothing saved yet. Use the bookmark icon next to any topic or example in the manual.
          </Text>
        )}
        {sorted.map((b) => (
          <MenuItem key={`${b.lab}:${b.key}`} onClick={() => onSelect(b)}>
            <Text as="span" fontFamily="mono" fontSize="0.72rem" color="lb.teal" mr="0.6rem">
              lab {String(b.lab).padStart(2, "0")}
            </Text>
            {b.title}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}

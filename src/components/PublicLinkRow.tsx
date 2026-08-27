import { Icon, type IconName } from "./Icon";
import { IconTile } from "./IconTile";
import { ListRow } from "./ListRow";

type PublicLinkRowProps = Readonly<{
  available: boolean;
  detail: string;
  icon: IconName;
  onPress: () => void;
  testID: string;
  title: string;
}>;

export function PublicLinkRow({ available, detail, icon, onPress, testID, title }: PublicLinkRowProps) {
  return (
    <ListRow
      detail={detail}
      disabled={!available}
      leading={<IconTile iconSize={20} name={icon} size={32} tone="settings" />}
      onPress={onPress}
      testID={testID}
      title={title}
      trailing={<Icon name="external-link" size={18} />}
      variant="grouped"
    />
  );
}

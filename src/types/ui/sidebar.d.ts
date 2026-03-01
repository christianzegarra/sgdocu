export enum ItemType {
  group = "group",
  menu = "menu",
  submenu = "submenu",
}

export type Permission = {
  key: string;
  label: string;
  isMain?: boolean;
};

type BaseMenuItem = {
  key: string;
  title: string;
  type: ItemType;
  icon?: any;
  permissions?: Permission[];
};

type GroupMenuItem = Partial<BaseMenuItem> & {
  type: ItemType.group;
  items: IMenuItem[];
};

type SingleMenuItem = BaseMenuItem & {
  type: ItemType.menu;
  url: string;
};

type SubMenuItem = BaseMenuItem & {
  type: ItemType.submenu;
  items: IMenuItem[];
};

export type IMenuItem = GroupMenuItem | SingleMenuItem | SubMenuItem;

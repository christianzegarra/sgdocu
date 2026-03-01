import { useEffect, type PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title: string;
}>;

export const Page = ({ children, title }: Props) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return children;
};

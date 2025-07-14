import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";

type ScrollAreaContext = {
  horizontalBarRef?: RefObject<HTMLDivElement | null>;
  horizontalGutterRef?: RefObject<HTMLDivElement | null>;
  verticalBarRef?: RefObject<HTMLDivElement | null>;
  verticalGutterRef?: RefObject<HTMLDivElement | null>;
  deriveScrollingStatus?: () => void;
};

const ScrollAreaContext = createContext<ScrollAreaContext>({});

export type ScrollAreaUseContainer = (props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerDomRef: RefObject<any>;
  children: ReactNode;
  onContainerScroll: () => void;
  onContainerResize: () => void;
  onContentResize: () => void;
  style?: CSSProperties;
}) => ReactNode;

const useContainerDefault: ScrollAreaUseContainer = ({
  containerDomRef,
  children,
  onContainerScroll,
  onContainerResize,
  style,
}) => {
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(onContainerResize);
    resizeObserver.observe(containerDomRef.current);
    return () => resizeObserver.disconnect();
  }, [containerDomRef, onContainerResize]);
  return (
    <div
      className="scroll-area"
      ref={containerDomRef}
      style={style}
      onScroll={onContainerScroll}
    >
      <ScrollAreaGutters />
      {children}
    </div>
  );
};

export type ScrollAreaProps = {
  useContainer?: ScrollAreaUseContainer;
  children?: ReactNode;
  style?: CSSProperties;
  verticalScrollbarMinHeight?: number;
  horizontalScrollbarMinWidth?: number;
};

export function ScrollArea(props: ScrollAreaProps) {
  const { children, style, useContainer = useContainerDefault } = props;
  const propsRef = useRef<ScrollAreaProps>(props);
  propsRef.current = props;
  const containerDomRef = useRef<HTMLDivElement>(null);
  const deriveScrollingStatusRef = useRef<() => void>(null);
  const deriveScrollingStatus = useCallback(() => {
    deriveScrollingStatusRef.current?.();
  }, []);
  const context: ScrollAreaContext = useMemo(() => ({}), []);
  useLayoutEffect(() => {
    const { teardown, deriveScrollingStatus } = setupScrolling({
      getVerticalBarMinHeight: () =>
        propsRef.current.verticalScrollbarMinHeight || 0,
      getHorizontalBarMinWidth: () =>
        propsRef.current.horizontalScrollbarMinWidth || 0,
      getContainerHeight: () => containerDomRef.current!.offsetHeight,
      getContainerWidth: () => containerDomRef.current!.offsetWidth,
      getScrollLeft: () => containerDomRef.current!.scrollLeft,
      getScrollTop: () => containerDomRef.current!.scrollTop,
      getScrollHeight: () => containerDomRef.current!.scrollHeight,
      getScrollWidth: () => containerDomRef.current!.scrollWidth,
      setScrollLeft: (v) => {
        containerDomRef.current!.scrollLeft = v;
      },
      setScrollTop: (v) => {
        containerDomRef.current!.scrollTop = v;
      },
      horizontalBar: context.horizontalBarRef!.current!,
      horizontalGutter: context.horizontalGutterRef!.current!,
      verticalBar: context.verticalBarRef!.current!,
      verticalGutter: context.verticalGutterRef!.current!,
    });
    deriveScrollingStatusRef.current = deriveScrollingStatus;
    return teardown;
  });

  useLayoutEffect(() => {
    deriveScrollingStatus();
  }, [
    deriveScrollingStatus,
    props.horizontalScrollbarMinWidth,
    props.verticalScrollbarMinHeight,
  ]);

  const onContainerResize = useCallback(() => {
    const offsetHeight = containerDomRef.current!.offsetHeight;
    context.verticalGutterRef!.current!.style.setProperty(
      "--container-height",
      `${offsetHeight}px`
    );
    context.horizontalGutterRef!.current!.style.setProperty(
      "--container-height",
      `${offsetHeight}px`
    );
    deriveScrollingStatus();
  }, [
    context.horizontalGutterRef,
    context.verticalGutterRef,
    deriveScrollingStatus,
  ]);

  const container = useContainer({
    containerDomRef,
    onContainerResize: onContainerResize,
    onContainerScroll: deriveScrollingStatus,
    onContentResize: deriveScrollingStatus,
    style,
    children,
  });

  return <ScrollAreaContext value={context}>{container}</ScrollAreaContext>;
}

export function ScrollAreaResizableContent({
  children,
}: {
  children?: ReactNode;
}) {
  const domRef = useRef<HTMLDivElement | null>(null);
  const { deriveScrollingStatus } = useContext(ScrollAreaContext);
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      deriveScrollingStatus?.();
    });
    return () => resizeObserver.disconnect();
  }, [deriveScrollingStatus]);
  return (
    <div className="scroll-area-content" ref={domRef}>
      {children}
    </div>
  );
}

export type ScrollAreaGuttersProps = {
  position?: "sticky" | "absolute";
};

export function ScrollAreaGutters({
  position = "sticky",
}: ScrollAreaGuttersProps) {
  const horizontalBarRef = useRef<HTMLDivElement>(null);
  const horizontalGutterRef = useRef<HTMLDivElement>(null);
  const verticalBarRef = useRef<HTMLDivElement>(null);
  const verticalGutterRef = useRef<HTMLDivElement>(null);
  const context = useContext(ScrollAreaContext);
  context.horizontalBarRef = horizontalBarRef;
  context.horizontalGutterRef = horizontalGutterRef;
  context.verticalBarRef = verticalBarRef;
  context.verticalGutterRef = verticalGutterRef;
  useLayoutEffect(() => {
    console.log("scrollgutter useLayoutEffect");
  }, []);
  return (
    <div className={`scroll-area-gutters ${position}`}>
      <div className="horizontal-gutter" ref={horizontalGutterRef}>
        <div className="horizontal-bar" ref={horizontalBarRef}></div>
      </div>
      <div className="vertical-gutter" ref={verticalGutterRef}>
        <div className="vertical-bar" ref={verticalBarRef}></div>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
}

function setupScrolling({
  getContainerWidth,
  getContainerHeight,
  getScrollHeight,
  getScrollLeft,
  getScrollTop,
  getScrollWidth,
  setScrollLeft,
  setScrollTop,
  verticalBar,
  verticalGutter,
  horizontalBar,
  horizontalGutter,
  getVerticalBarMinHeight,
  getHorizontalBarMinWidth,
}: {
  getContainerWidth: () => number;
  getContainerHeight: () => number;
  getScrollHeight: () => number;
  getScrollWidth: () => number;
  getScrollTop: () => number;
  getScrollLeft: () => number;
  setScrollLeft: (v: number) => void;
  setScrollTop: (v: number) => void;
  getVerticalBarMinHeight: () => number;
  getHorizontalBarMinWidth: () => number;
  verticalGutter: HTMLDivElement;
  horizontalGutter: HTMLDivElement;
  verticalBar: HTMLDivElement;
  horizontalBar: HTMLDivElement;
}): {
  deriveScrollingStatus: () => void;
  teardown: () => void;
} {
  let isVerticalDragging = false;
  let isHorizontalDragging = false;
  let startX = 0;
  let startY = 0;
  let startXBarRatio = 0;
  let startYBarRatio = 0;
  let diffX = 0;
  let diffY = 0;

  function updateBarByDom() {
    const verticalGutterHeight = verticalGutter.offsetHeight;
    const horizontalGutterWidth = horizontalGutter.offsetWidth;
    const containerHeight = getContainerHeight();
    const containerWidth = getContainerWidth();
    const scrollHeight = getScrollHeight();
    const scrollWidth = getScrollWidth();
    const scrollTop = getScrollTop();
    const scrollLeft = getScrollLeft();

    if (scrollHeight <= containerHeight) {
      verticalBar.style.display = "none";
    } else {
      const verticalBarHeight = Math.max(
        getVerticalBarMinHeight(),
        (verticalGutterHeight / scrollHeight) * containerHeight
      );
      const verticalBarOffset =
        ((verticalGutterHeight - verticalBarHeight) * scrollTop) /
        (scrollHeight - containerHeight);
      verticalBar.style.display = "";
      verticalBar.style.top = `${verticalBarOffset}px`;
      verticalBar.style.height = `${verticalBarHeight}px`;
    }

    if (scrollWidth <= containerWidth) {
      horizontalBar.style.display = "none";
    } else {
      const horizontalBarWidth = Math.max(
        getHorizontalBarMinWidth(),
        (horizontalGutterWidth / scrollWidth) * containerWidth
      );
      const horizontalBarOffset =
        ((horizontalGutterWidth - horizontalBarWidth) * scrollLeft) /
        (scrollWidth - containerWidth);

      horizontalBar.style.display = "";
      horizontalBar.style.left = `${horizontalBarOffset}px`;
      horizontalBar.style.width = `${horizontalBarWidth}px`;
    }
  }

  function updateDomByBar() {
    const verticalGutterHeight = verticalGutter.offsetHeight;
    const horizontalGutterWidth = horizontalGutter.offsetWidth;
    const containerHeight = getContainerHeight();
    const containerWidth = getContainerWidth();
    const scrollHeight = getScrollHeight();
    const scrollWidth = getScrollWidth();
    const { top: verticalGutterClientTop } =
      verticalGutter.getBoundingClientRect();
    const { left: horizonlGutterClientLeft } =
      horizontalGutter.getBoundingClientRect();

    if (scrollHeight <= containerHeight) {
      verticalBar.style.display = "none";
    } else {
      if (isVerticalDragging) {
        const verticalBarHeight = Math.max(
          getVerticalBarMinHeight(),
          (verticalGutterHeight / scrollHeight) * containerHeight
        );
        const currentMouseY = startY + diffY;

        let verticalBarOffset =
          currentMouseY -
          verticalBarHeight * startYBarRatio -
          verticalGutterClientTop;

        verticalBarOffset = clamp(
          verticalBarOffset,
          0,
          verticalGutterHeight - verticalBarHeight
        );

        verticalBar.style.display = "";
        verticalBar.style.top = `${verticalBarOffset}px`;
        verticalBar.style.height = `${verticalBarHeight}px`;
        setScrollTop(
          ((scrollHeight - containerHeight) * verticalBarOffset) /
            (verticalGutterHeight - verticalBarHeight)
        );
      }
    }

    if (scrollWidth <= containerWidth) {
      horizontalBar.style.display = "none";
    } else {
      if (isHorizontalDragging) {
        const horizontalBarWidth = Math.max(
          getHorizontalBarMinWidth(),
          (horizontalGutterWidth / scrollWidth) * containerWidth
        );

        const currentMouseX = startX + diffX;
        let horizontalBarOffset =
          currentMouseX -
          horizontalBarWidth * startXBarRatio -
          horizonlGutterClientLeft;

        horizontalBarOffset = clamp(
          horizontalBarOffset,
          0,
          horizontalGutterWidth - horizontalBarWidth
        );
        horizontalBar.style.display = "";
        horizontalBar.style.left = `${horizontalBarOffset}px`;
        horizontalBar.style.width = `${horizontalBarWidth}px`;

        setScrollLeft(
          ((scrollWidth - containerWidth) * horizontalBarOffset) /
            (horizontalGutterWidth - horizontalBarWidth)
        );
      }
    }
  }

  function deriveScrollingStatus() {
    if (isVerticalDragging || isHorizontalDragging) {
      updateDomByBar();
    } else {
      updateBarByDom();
    }
  }

  const onHorizontalWindowMouseUp = () => {
    isHorizontalDragging = false;
    window.removeEventListener("mouseup", onHorizontalWindowMouseUp);
    window.removeEventListener("mousemove", onHorizontalWindowMouseMove);
  };

  const onVerticalWindowMouseUp = () => {
    isVerticalDragging = false;
    window.removeEventListener("mouseup", onVerticalWindowMouseUp);
    window.removeEventListener("mousemove", onVerticalWindowMouseMove);
  };

  const onHorizontalWindowMouseMove = (e: MouseEvent) => {
    diffX = e.clientX - startX;
    deriveScrollingStatus();
  };

  const onVerticalWindowMouseMove = (e: MouseEvent) => {
    diffY = e.clientY - startY;
    deriveScrollingStatus();
  };

  horizontalBar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isHorizontalDragging = true;
    startX = e.clientX;
    const { left: horizontalBarClientLeft } =
      horizontalBar.getBoundingClientRect();
    startXBarRatio =
      (e.clientX - horizontalBarClientLeft) / horizontalBar.offsetWidth;
    window.addEventListener("mousemove", onHorizontalWindowMouseMove);
    window.addEventListener("mouseup", onHorizontalWindowMouseUp);
  });

  verticalBar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isVerticalDragging = true;
    startY = e.clientY;
    const { top: verticalBarClientTop } = verticalBar.getBoundingClientRect();
    startYBarRatio =
      (e.clientY - verticalBarClientTop) / verticalBar.offsetHeight;
    window.addEventListener("mousemove", onVerticalWindowMouseMove);
    window.addEventListener("mouseup", onVerticalWindowMouseUp);
  });

  return {
    deriveScrollingStatus,
    teardown: () => {
      window.removeEventListener("mouseup", onHorizontalWindowMouseUp);
      window.removeEventListener("mouseup", onVerticalWindowMouseUp);
      window.removeEventListener("mousemove", onHorizontalWindowMouseMove);
      window.removeEventListener("mousemove", onHorizontalWindowMouseMove);
    },
  };
}

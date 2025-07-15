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
  guttersRef?: RefObject<HTMLDivElement | null>;
  deriveScrollingStatus?: () => void;
};

const ScrollAreaContext = createContext<ScrollAreaContext>({});

export type DirectionInsets = {
  leading: number;
  trailing: number;
  top: number;
  bottom: number;
};

export type ScrollAreaUseContainer = (props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerDomRef: RefObject<any>;
  onContainerScroll: () => void;
  onContainerResize: () => void;
  onContentResize: () => void;
  scrollAreaProps: ScrollAreaProps;
}) => ReactNode;

const useContainerDefault: ScrollAreaUseContainer = ({
  containerDomRef,
  onContainerScroll,
  onContainerResize,
  scrollAreaProps,
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
      style={scrollAreaProps.style}
      onScroll={onContainerScroll}
    >
      <ScrollAreaGutters />
      {scrollAreaProps.children}
    </div>
  );
};

type ScrollAreaGuttersContext = {
  guttersPosition: "sticky" | "absolute";
  verticalScrollbarInsets: DirectionInsets;
  horizontalScrollbarInsets: DirectionInsets;
  conflictedVerticalScrollbarInsets: DirectionInsets;
  conflictedHorizontalScrollbarInsets: DirectionInsets;
  verticalScrollbarWidth: number;
  horizontalScrollbarHeight: number;
};

export type ScrollAreaProps = {
  useContainer?: ScrollAreaUseContainer;
  children?: ReactNode;
  style?: CSSProperties;
  verticalScrollbarMinHeight?: number;
  horizontalScrollbarMinWidth?: number;
} & Partial<ScrollAreaGuttersContext>;

function useLatestValueGetter<T>(value: T): () => T {
  const ref = useRef(value);
  ref.current = value;
  return () => ref.current;
}

export function ScrollArea(props: ScrollAreaProps) {
  const {
    verticalScrollbarInsets = { leading: 0, trailing: 8, top: 8, bottom: 8 },
    horizontalScrollbarInsets = { leading: 8, trailing: 8, top: 0, bottom: 8 },
    verticalScrollbarMinHeight = 0,
    horizontalScrollbarMinWidth = 0,
    conflictedHorizontalScrollbarInsets = {
      leading: 8,
      trailing: 16,
      top: 0,
      bottom: 8,
    },
    conflictedVerticalScrollbarInsets = {
      leading: 0,
      trailing: 8,
      top: 8,
      bottom: 16,
    },
    verticalScrollbarWidth = 8,
    horizontalScrollbarHeight = 8,
    guttersPosition = "sticky",
    useContainer = useContainerDefault,
  } = props;
  const containerDomRef = useRef<HTMLDivElement>(null);
  const deriveScrollingStatusRef = useRef<() => void>(null);
  const deriveScrollingStatus = useCallback(() => {
    deriveScrollingStatusRef.current?.();
  }, []);
  const context: ScrollAreaContext = useMemo(() => ({}), []);
  const getVerticalScrollbarMinHeight = useLatestValueGetter(
    verticalScrollbarMinHeight
  );
  const getHorizontalScrollbarMinWidth = useLatestValueGetter(
    horizontalScrollbarMinWidth
  );
  const getGuttersPosition = useLatestValueGetter(guttersPosition);
  const getVerticalScrollbarInsets = useLatestValueGetter(
    verticalScrollbarInsets
  );
  const getHorizontalScrollbarInsets = useLatestValueGetter(
    horizontalScrollbarInsets
  );
  const getConflictedVerticalScrollbarInsets = useLatestValueGetter(
    conflictedVerticalScrollbarInsets
  );
  const getConflictedHorizontalScrollbarInsets = useLatestValueGetter(
    conflictedHorizontalScrollbarInsets
  );
  const getVerticalScrollbarWidth = useLatestValueGetter(
    verticalScrollbarWidth
  );
  const getHorizontalScrollbarHeight = useLatestValueGetter(
    horizontalScrollbarHeight
  );
  useLayoutEffect(() => {
    const { teardown, deriveScrollingStatus } = setupScrolling({
      getVerticalScrollbarMinHeight,
      getHorizontalScrollbarMinWidth,
      container: containerDomRef.current!,
      horizontalBar: context.horizontalBarRef!.current!,
      horizontalGutter: context.horizontalGutterRef!.current!,
      verticalBar: context.verticalBarRef!.current!,
      verticalGutter: context.verticalGutterRef!.current!,
      gutters: context.guttersRef!.current!,
      getGuttersPosition,
      getVerticalScrollbarInsets,
      getHorizontalScrollbarInsets,
      getConflictedVerticalScrollbarInsets,
      getConflictedHorizontalScrollbarInsets,
      getVerticalScrollbarWidth,
      getHorizontalScrollbarHeight,
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
    guttersPosition,
    verticalScrollbarInsets.leading,
    verticalScrollbarInsets.trailing,
    verticalScrollbarInsets.top,
    verticalScrollbarInsets.bottom,
    horizontalScrollbarInsets.leading,
    horizontalScrollbarInsets.trailing,
    horizontalScrollbarInsets.top,
    horizontalScrollbarInsets.bottom,
    conflictedVerticalScrollbarInsets.leading,
    conflictedVerticalScrollbarInsets.trailing,
    conflictedVerticalScrollbarInsets.top,
    conflictedVerticalScrollbarInsets.bottom,
    conflictedHorizontalScrollbarInsets.leading,
    conflictedHorizontalScrollbarInsets.trailing,
    conflictedHorizontalScrollbarInsets.top,
    conflictedHorizontalScrollbarInsets.bottom,
    verticalScrollbarWidth,
    horizontalScrollbarHeight,
  ]);

  const onContainerResize = useCallback(() => {
    const offsetHeight = containerDomRef.current!.offsetHeight;
    const verticalGutter = context.verticalGutterRef!.current!;
    const horizontalGutter = context.horizontalGutterRef!.current!;
    verticalGutter.style.setProperty("--container-height", `${offsetHeight}px`);
    horizontalGutter.style.setProperty(
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
    scrollAreaProps: props,
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

export function ScrollAreaGutters() {
  const horizontalBarRef = useRef<HTMLDivElement>(null);
  const horizontalGutterRef = useRef<HTMLDivElement>(null);
  const verticalBarRef = useRef<HTMLDivElement>(null);
  const verticalGutterRef = useRef<HTMLDivElement>(null);
  const guttersRef = useRef<HTMLDivElement>(null);
  const context = useContext(ScrollAreaContext);
  context.horizontalBarRef = horizontalBarRef;
  context.horizontalGutterRef = horizontalGutterRef;
  context.verticalBarRef = verticalBarRef;
  context.verticalGutterRef = verticalGutterRef;
  context.guttersRef = guttersRef;
  return (
    <div className="scroll-area-gutters" ref={guttersRef}>
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
  container,
  verticalBar,
  verticalGutter,
  horizontalBar,
  horizontalGutter,
  getVerticalScrollbarMinHeight,
  getHorizontalScrollbarMinWidth,
  gutters,
  getGuttersPosition,
  getVerticalScrollbarInsets,
  getHorizontalScrollbarInsets,
  getConflictedVerticalScrollbarInsets,
  getConflictedHorizontalScrollbarInsets,
  getVerticalScrollbarWidth,
  getHorizontalScrollbarHeight,
}: {
  container: HTMLElement;
  gutters: HTMLDivElement;
  verticalGutter: HTMLDivElement;
  horizontalGutter: HTMLDivElement;
  verticalBar: HTMLDivElement;
  horizontalBar: HTMLDivElement;
  getVerticalScrollbarMinHeight: () => number;
  getHorizontalScrollbarMinWidth: () => number;
  getGuttersPosition: () => "sticky" | "absolute";
  getVerticalScrollbarInsets: () => DirectionInsets;
  getHorizontalScrollbarInsets: () => DirectionInsets;
  getConflictedVerticalScrollbarInsets: () => DirectionInsets;
  getConflictedHorizontalScrollbarInsets: () => DirectionInsets;
  getVerticalScrollbarWidth: () => number;
  getHorizontalScrollbarHeight: () => number;
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

  function setupGuttersAndScrollbarStyle(confilcted: boolean) {
    gutters.style.position = getGuttersPosition();
    gutters.style.top = "0";
    gutters.style.left = "0";
    gutters.style.right = "0";
    const verticalInsets = confilcted
      ? getConflictedVerticalScrollbarInsets()
      : getVerticalScrollbarInsets();
    const horizontalInsets = confilcted
      ? getConflictedHorizontalScrollbarInsets()
      : getHorizontalScrollbarInsets();
    verticalGutter.style.right = `${verticalInsets.trailing}px`;
    verticalGutter.style.top = `${verticalInsets.top}px`;
    horizontalGutter.style.left = `${horizontalInsets.leading}px`;
    horizontalGutter.style.right = `${horizontalInsets.trailing}px`;
    switch (getGuttersPosition()) {
      case "sticky":
        verticalGutter.style.bottom = `calc(0px - var(--container-height) + ${verticalInsets.bottom}px)`;
        horizontalGutter.style.top = `calc(var(--container-height) - ${
          horizontalInsets.bottom + getHorizontalScrollbarHeight()
        }px)`;
        gutters.style.bottom = "";
        gutters.style.height = "0";
        break;
      case "absolute":
        verticalGutter.style.bottom = `${verticalInsets.bottom}px`;
        horizontalGutter.style.bottom = `${horizontalInsets.bottom}px`;
        gutters.style.bottom = "0";
        gutters.style.height = "";
        break;
    }
    horizontalGutter.style.height = `${getHorizontalScrollbarHeight()}px`;
    verticalGutter.style.width = `${getVerticalScrollbarWidth()}px`;
  }

  function updateBarByDom() {
    const scrollHeight = container.scrollHeight;
    const scrollWidth = container.scrollWidth;
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    const containerHeight = container.offsetHeight;
    const containerWidth = container.offsetWidth;
    const isVerticalScrollable = scrollHeight > containerHeight;
    const isHorizontalScrollable = scrollWidth > containerWidth;
    setupGuttersAndScrollbarStyle(
      isVerticalScrollable && isHorizontalScrollable
    );
    const verticalGutterHeight = verticalGutter.offsetHeight;
    const horizontalGutterWidth = horizontalGutter.offsetWidth;

    if (scrollHeight <= containerHeight) {
      verticalBar.style.display = "none";
    } else {
      const verticalBarHeight = Math.max(
        getVerticalScrollbarMinHeight(),
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
        getHorizontalScrollbarMinWidth(),
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
    const containerHeight = container.offsetHeight;
    const containerWidth = container.offsetWidth;
    const scrollHeight = container.scrollHeight;
    const scrollWidth = container.scrollWidth;
    const isVerticalScrollable = scrollHeight > containerHeight;
    const isHorizontalScrollable = scrollWidth > containerWidth;
    setupGuttersAndScrollbarStyle(
      isVerticalScrollable && isHorizontalScrollable
    );

    const verticalGutterHeight = verticalGutter.offsetHeight;
    const horizontalGutterWidth = horizontalGutter.offsetWidth;

    const { top: verticalGutterClientTop } =
      verticalGutter.getBoundingClientRect();
    const { left: horizonlGutterClientLeft } =
      horizontalGutter.getBoundingClientRect();

    if (scrollHeight <= containerHeight) {
      verticalBar.style.display = "none";
    } else {
      if (isVerticalDragging) {
        const verticalBarHeight = Math.max(
          getVerticalScrollbarMinHeight(),
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
        container.scrollTop =
          ((scrollHeight - containerHeight) * verticalBarOffset) /
          (verticalGutterHeight - verticalBarHeight);
      }
    }

    if (scrollWidth <= containerWidth) {
      horizontalBar.style.display = "none";
    } else {
      if (isHorizontalDragging) {
        const horizontalBarWidth = Math.max(
          getHorizontalScrollbarMinWidth(),
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

        container.scrollLeft =
          ((scrollWidth - containerWidth) * horizontalBarOffset) /
          (horizontalGutterWidth - horizontalBarWidth);
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

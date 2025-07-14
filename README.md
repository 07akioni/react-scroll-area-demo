# Basic usage

```tsx
function Demo() {
  return <ScrollArea>static content</ScrollArea>;
}
```

# Resizable content

```tsx
function Demo() {
  return (
    <ScrollArea>
      <ScrollAreaResizableContent>resizable content</ScrollAreaResizableContent>
    </ScrollArea>
  );
}
```

# Using scroll area with textarea

```tsx
function Demo() {
  const useContainer: ScrollAreaUseContainer = ({
    containerDomRef,
    onContentResize,
    onContainerResize,
    onContainerScroll,
  }) => {
    const [value, setValue] = useState("");
    const contentDomRef = useRef<HTMLDivElement | null>(null);
    useLayoutEffect(() => {
      const resizeObserver = new ResizeObserver(() => {
        onContentResize();
        onContainerResize();
      });
      resizeObserver.observe(containerDomRef.current);
      if (contentDomRef.current) {
        resizeObserver.observe(contentDomRef.current);
      }
      return () => resizeObserver.disconnect();
    }, [containerDomRef, onContentResize, onContainerResize]);
    const textareaSharedStyle: CSSProperties = {
      fontFamily: "-system-ui",
      display: "block",
      boxSizing: "border-box",
      padding: 12,
      fontSize: 14,
      lineHeight: 1.6,
      border: "none",
      textAlign: "start",
      width: "100%",
    };
    return (
      <div
        style={{
          position: "relative",
          boxShadow: "inset 0 0 0 1px red",
          background: "white",
          display: "flex",
          width: 200,
          height: 200,
          overflow: "hidden",
          resize: "both",
          alignItems: "stretch",
        }}
      >
        <ScrollAreaGutters position="absolute" />
        <textarea
          ref={containerDomRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onScroll={onContainerScroll}
          style={{
            background: "#0000",
            ...textareaSharedStyle,
          }}
        ></textarea>
        <div
          className="textarea-mirror"
          ref={contentDomRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            whiteSpace: "pre-wrap",
            pointerEvents: "none",
            visibility: "hidden",
            ...textareaSharedStyle,
          }}
        >
          {value}
        </div>
      </div>
    );
  };
  return <ScrollArea useContainer={useContainer} />;
}
```

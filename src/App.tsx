import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import {
  ScrollArea,
  ScrollAreaGutters,
  type ScrollAreaUseContainer,
} from "./ScrollArea";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const repeated = (
  <>
    <div style={{ width: 1000 }}>
      <a href="https://vite.dev" target="_blank">
        <img src={viteLogo} className="logo" alt="Vite logo" />
      </a>
      <a href="https://react.dev" target="_blank">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>
    </div>
    <h1>Vite + React</h1>
    <div className="card">
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
    <p className="read-the-docs">
      Click on the Vite and React logos to learn more
    </p>
  </>
);

function Demo1() {
  return (
    <ScrollArea
      style={{ height: 200, resize: "both" }}
      verticalScrollbarMinHeight={16}
    >
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
      {repeated}
    </ScrollArea>
  );
}

function Demo2() {
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
        <ScrollAreaGutters />
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
  return <ScrollArea guttersPosition="absolute" useContainer={useContainer} />;
}

function App() {
  return <Demo1 />;
}

export default App;

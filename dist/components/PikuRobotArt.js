import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PikuRobotArt — official Piku robot mascot (design-provided SVG).
 * classes/gradient ids namespaced pk-*; blink via pk-eye; talking mouth.
 */
const PK_CSS = `
      .pk-st0 {
        fill: #011f70;
      }

      .pk-st1 {
        fill: url(#pk-lg4);
      }

      .pk-st1, .pk-st2, .pk-st3 {
        mix-blend-mode: multiply;
      }

      .pk-st2 {
        fill: url(#pk-lg1);
      }

      .pk-st4 {
        fill: #ebfeff;
      }

      .pk-st5 {
        fill: #fff;
      }

      .pk-st6 {
        fill: #011f75;
      }

      .pk-st7 {
        isolation: isolate;
      }

      .pk-st3 {
        fill: url(#pk-lg2);
      }

      .pk-st8 {
        fill: #16d5fe;
      }

      .pk-st9 {
        fill: #04297a;
      }

      .pk-st10 {
        fill: url(#pk-lg5);
      }

      .pk-st11 {
        fill: url(#pk-lg3);
      }

      .pk-st12 {
        fill: #0242cb;
      }

      .pk-st13 {
        fill: #53e0fb;
      }

      .pk-st14 {
        fill: url(#pk-lg);
      }

      .pk-st15 {
        fill: #b6fcfc;
      }
    `;
export function PikuRobotArt({ blink, talking }) {
    const cs = (...c) => c.filter(Boolean).join(' ');
    return (_jsxs("svg", { viewBox: "0 0 277.39 277.39", className: "gunma-chef-svg pk-robot", "aria-hidden": "true", children: [_jsx("style", { dangerouslySetInnerHTML: { __html: PK_CSS } }), _jsxs("defs", { children: [_jsxs("linearGradient", { id: "pk-lg", x1: "132.21", y1: "148.88", x2: "149.86", y2: "258.41", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#fff" }), _jsx("stop", { offset: ".1", stopColor: "#f8fdfe" }), _jsx("stop", { offset: ".23", stopColor: "#e6fafe" }), _jsx("stop", { offset: ".39", stopColor: "#c8f5fe" }), _jsx("stop", { offset: ".56", stopColor: "#9fedfe" }), _jsx("stop", { offset: ".75", stopColor: "#69e4fe" }), _jsx("stop", { offset: ".94", stopColor: "#29d8fe" }), _jsx("stop", { offset: "1", stopColor: "#16d5fe" })] }), _jsxs("linearGradient", { id: "pk-lg1", x1: "138.62", y1: "165.36", x2: "138.62", y2: "234.91", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#fff", stopOpacity: ".4" }), _jsx("stop", { offset: "1", stopColor: "#14b4ff" })] }), _jsxs("linearGradient", { id: "pk-lg2", x1: "137.69", y1: "153.91", x2: "137.74", y2: "174.88", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#fff" }), _jsx("stop", { offset: ".11", stopColor: "#fafdff" }), _jsx("stop", { offset: ".24", stopColor: "#ecf9ff" }), _jsx("stop", { offset: ".38", stopColor: "#d5f1ff" }), _jsx("stop", { offset: ".52", stopColor: "#b5e7ff" }), _jsx("stop", { offset: ".67", stopColor: "#8cdaff" }), _jsx("stop", { offset: ".82", stopColor: "#5acaff" }), _jsx("stop", { offset: ".97", stopColor: "#20b7ff" }), _jsx("stop", { offset: "1", stopColor: "#14b4ff" })] }), _jsxs("linearGradient", { id: "pk-lg3", x1: "127.31", y1: "-78.53", x2: "141.69", y2: "148.91", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#fff" }), _jsx("stop", { offset: ".15", stopColor: "#fbfefe" }), _jsx("stop", { offset: ".28", stopColor: "#f0fcfe" }), _jsx("stop", { offset: ".41", stopColor: "#def9fe" }), _jsx("stop", { offset: ".53", stopColor: "#c4f4fe" }), _jsx("stop", { offset: ".65", stopColor: "#a3eefe" }), _jsx("stop", { offset: ".77", stopColor: "#7ae7fe" }), _jsx("stop", { offset: ".89", stopColor: "#4bdefe" }), _jsx("stop", { offset: "1", stopColor: "#16d5fe" })] }), _jsxs("linearGradient", { id: "pk-lg4", x1: "92.39", y1: "67.48", x2: "230.22", y2: "202.8", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#fff", stopOpacity: ".4" }), _jsx("stop", { offset: "1", stopColor: "#16d5fe" })] }), _jsxs("linearGradient", { id: "pk-lg5", x1: "60.92", y1: "121.41", x2: "129.09", y2: "170.06", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#0149ff" }), _jsx("stop", { offset: ".13", stopColor: "#0147f8" }), _jsx("stop", { offset: ".32", stopColor: "#0141e6" }), _jsx("stop", { offset: ".53", stopColor: "#0139c8" }), _jsx("stop", { offset: ".77", stopColor: "#012c9f" }), _jsx("stop", { offset: "1", stopColor: "#011f70" })] })] }), _jsx("g", { className: "pk-st7", children: _jsx("g", { id: "Layer_1", children: _jsxs("g", { children: [_jsx("path", { className: "pk-st14", d: "M179.64,174.08c14.75,19.81-8.28,59.95-26.76,67.77-7.38,3.13-14.63,2.98-14.63,2.98s-8.53-.17-17.18-5c-17.64-9.84-37.31-48.23-22.49-66.85,8.46-10.63,24.79-10.57,39.67-10.53,14.91.05,32.82.11,41.39,11.62Z" }), _jsx("path", { className: "pk-st2", d: "M171.81,170.38c10.14,12.78-1.41,35.68-7.79,45.09-4.27,6.3-13.05,19.24-25.62,18.94-10.19-.25-17.16-9.07-22.03-15.23-8.9-11.26-21.33-35.29-11.11-48.42,6.39-8.21,18.63-8.31,33.14-8.43,14.51-.12,26.86-.22,33.41,8.04Z" }), _jsx("path", { className: "pk-st0", d: "M165.68,185.71c5.93,6.44-1,22.95-8.5,32.25-3.48,4.32-9.74,12.08-18.72,11.94-7.36-.11-12.49-5.46-15.83-8.94-10.08-10.5-16.92-28.93-10.6-35.51,3.49-3.64,7.96-.48,26.19-.38,18.89.1,23.88-3.25,27.47.64Z" }), _jsx("rect", { className: "pk-st5", x: "126.08", y: "194.91", width: "25.42", height: "6.64", rx: "3.32", ry: "3.32" }), _jsx("path", { className: "pk-st3", d: "M120.4,160.45s-3.84,3.89-7.55,3.73,2.76,7,23.01,7.46c20.25.47,30.44-6.69,27.09-7.77s-3.67-.24-6.02-2.57l-18.83-6.14-17.69,5.3Z" }), _jsxs("g", { children: [_jsx("path", { className: "pk-st0", d: "M217.67,112.21h-3.44c-.56-16.02-7.43-31.61-14.79-41.98-20.75-29.19-54.68-29.86-60.58-29.86-6.36,0-41.36.86-61.31,30.99-7.41,11.19-12.5,26.05-12.88,40.85h-3.43c-.56-16.89,5.01-34.29,13.45-47.1,20.86-31.66,57.48-32.56,64.13-32.56,6.18,0,41.67.7,63.37,31.38,8.34,11.79,16.07,30.02,15.48,48.28Z" }), _jsxs("g", { children: [_jsx("path", { className: "pk-st9", d: "M101.68,108.65c-1.36,17.28-29.61,29.68-43.93,20.19-9.44-6.25-9.29-19.64-9.28-20.19.33-12.94,10.93-26.88,26.61-26.88,16.42,0,27.52,15.28,26.61,26.88Z" }), _jsx("path", { className: "pk-st13", d: "M68.95,88.23c-.27.27-.66.67-1.09,1.17-1.83,2.14-4.08,5.78-5.05,17.11-1.19,13.89,1.3,18.94,2.11,20.46.48.89.93,1.6,1.25,2.06-.45.25-1.04.46-1.68.35-4.01-.72-5.37-13.74-4.4-23.62.25-2.58,1.85-17.03,7.04-17.8.74-.11,1.39.08,1.83.27Z" })] }), _jsxs("g", { children: [_jsx("path", { className: "pk-st9", d: "M175.7,108.65c1.36,17.28,29.61,29.68,43.93,20.19,9.44-6.25,9.29-19.64,9.28-20.19-.33-12.94-10.93-26.88-26.61-26.88-16.42,0-27.52,15.28-26.61,26.88Z" }), _jsx("path", { className: "pk-st13", d: "M208.44,88.23c.27.27.66.67,1.09,1.17,1.83,2.14,4.08,5.78,5.05,17.11,1.19,13.89-1.3,18.94-2.11,20.46-.48.89-.93,1.6-1.25,2.06.45.25,1.04.46,1.68.35,4.01-.72,5.37-13.74,4.4-23.62-.25-2.58-1.85-17.03-7.04-17.8-.74-.11-1.39.08-1.83.27Z" })] }), _jsx("path", { className: "pk-st11", d: "M206.26,134.64c-7.47,14.19-21.37,21.04-35.3,24.41-12.07,2.92-24.16,3.22-32.09,3.42-18.19.45-46.67,1.16-62.17-19.83-15.11-20.46-9.51-50.19,3.31-68.86,2.54-3.7,5.34-6.93,8.29-9.73,0,0,.02-.02.03-.02,19.3-18.33,45.25-18.93,50.55-18.94,5.67,0,38.25.62,58.17,27.65,10.79,14.63,20.47,40.55,9.22,61.91Z" }), _jsx("path", { className: "pk-st1", d: "M200.14,136.15c-6.34,12.4-17.46,19.16-29.18,22.89-12.07,2.92-24.16,3.22-32.09,3.42-18.19.45-46.67,1.16-62.17-19.83-15.11-20.46-9.51-50.19,3.31-68.86,2.54-3.7,5.34-6.93,8.29-9.73,0,0,.02-.02.03-.02,18.37-16.39,41.85-16.94,46.78-16.95,5.47,0,36.92.61,56.15,27.5,10.41,14.56,19.76,40.33,8.9,61.58Z" }), _jsx("path", { className: "pk-st0", d: "M193.44,110.78c.1,3.85.31,11.86-2.28,17.66-7.39,16.53-38.43,17.07-50.85,17.28-12.53.22-45.07.78-53.35-16.4-3.23-6.7-3.03-16.64-2.99-18.54.03-1.65.23-11.19,3.5-17.79,8.41-16.97,38.58-17.4,51.05-17.58,12.65-.18,42.39-.6,51.05,15.89,3.55,6.76,3.81,16.87,3.88,19.48Z" }), _jsx("rect", { className: cs("pk-st5", "pk-eye", blink && "blink"), x: "112.11", y: "98.38", width: "9.44", height: "22.25", rx: "4.72", ry: "4.72" }), _jsx("rect", { className: cs("pk-st5", "pk-eye", blink && "blink"), x: "155.83", y: "98.38", width: "9.44", height: "22.25", rx: "4.72", ry: "4.72" }), !talking ? (_jsx("path", { className: "pk-smile", d: "M149.65,125.24v.03c0,5.82-4.9,10.53-10.95,10.53s-10.96-4.71-10.96-10.53v-.03h21.91Z" })) : (_jsx("rect", { className: "pk-open", x: "128", y: "126", width: "21", height: "11", rx: "5", fill: "#011f75", stroke: "#16d5fe", strokeOpacity: ".7" })), _jsx("path", { className: "pk-st10", d: "M68.12,126.35c1.32,6.64,4.46,9.74,4.78,10.08,7.42,7.95,22.38,10.19,27.41,10.78.6.07,1.08.12,1.18.13,5.76.57,10.49.25,13.82-.18l.31,4.78s-1.99.15-4.73.24c0,0-4.85.14-9.24-.14-5.88-.38-20.87-1.34-30.63-10.71-2.93-2.81-3.89-4.48-5.57-7.7,0,0-2.07-4.52-1.78-8.16.02-.2.17-.55.46-.89.72-.85,2.09-.63,2.19-.61.24.05.54.18.94.56.68.64.83,1.64.87,1.85Z" }), _jsx("ellipse", { className: "pk-st12", cx: "120.45", cy: "149.21", rx: "9.6", ry: "7.24" }), _jsx("ellipse", { className: "pk-st0", cx: "120.45", cy: "149.71", rx: "9.38", ry: "6.74" })] })] }) }) })] }));
}

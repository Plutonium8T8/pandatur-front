import React from "react";

export const ScrollContainer = React.forwardRef(function ScrollContainer(props, ref) {
    const { height, children } = props;
    return (
        <div
            ref={ref}
            style={{
                flex: "1 1 auto",
                height: height,
                overflow: "auto",
                paddingBottom: 12,
            }}
        >
            {children}
        </div>
    );
});

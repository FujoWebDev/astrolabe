import React from "react";

export const Test = () => {
    const [counter, setCounter] = React.useState(0);
    return <button onClick={() => setCounter((c) => c+1)}>{counter}</button>
}
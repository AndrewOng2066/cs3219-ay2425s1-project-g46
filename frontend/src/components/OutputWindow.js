const OutputWindow = ({ outputDetails }) => {
  const getOutput = () => {
    let statusId = outputDetails?.status?.id;

    if (statusId === 6) {
      // Compilation error
      return (
        <pre style={{ padding: "8px", fontSize: "12px", color: "red" }}>
          {atob(outputDetails?.compile_output)}
        </pre>
      );
    } else if (statusId === 3) {
      return (
        <pre style={{ padding: "8px", fontSize: "12px", color: "green" }}>
          {outputDetails.stdout
            ? `${atob(outputDetails.stdout)}`
            : "Compiled successfully"}
        </pre>
      );
    } else if (statusId === 5) {
      return (
        <pre style={{ padding: "8px", fontSize: "12px", color: "red" }}>
          {`Time Limit Exceeded`}
        </pre>
      );
    } else {
      return (
        <pre style={{ padding: "8px", fontSize: "12px", color: "red" }}>
          {atob(outputDetails?.stderr)}
        </pre>
      );
    }
  };

  return (
    <>
      <h1 style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "8px" }}>
        Output
      </h1>
      <div
        style={{
          width: "100%",
          height: "220px", 
          backgroundColor: "#1e293b",
          borderRadius: "8px",
          color: "white",
          overflowY: "auto",
          padding: "8px", 
        }}
      >
        {outputDetails ? <>{getOutput()}</> : null}
      </div>
    </>
  );
};

export default OutputWindow;

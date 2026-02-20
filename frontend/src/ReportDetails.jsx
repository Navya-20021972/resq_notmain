const handleReferenceIdSearch = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      `http://localhost:8000/api/reports/${referenceId}/`
    );

    const data = await response.json();

    if (response.ok) {
      setSubmittedData(data.report);     // 👈 IMPORTANT
      setStatusData(data.backend_status);
      setActiveView("details");          // 👈 NEXT PAGE
    } else {
      alert("Invalid reference ID");
    }
  } catch (error) {
    console.error(error);
    alert("Failed to fetch details. Please check backend.");
  }
};

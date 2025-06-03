export default function NewMetricForm() {
  return (
    <div>
      <h2>Add New Metric</h2>
      {/* Add your form fields here */}
      <form>
        <label>
          Metric Name:
          <input type="text" name="metricName" />
        </label>
        <br />
        <label>
          Description:
          <textarea name="description" />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

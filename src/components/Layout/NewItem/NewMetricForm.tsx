export default function NewMetricForm({ handleClose }: { handleClose: () => void }) {
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
        <button type="button" onClick={handleClose}>
          Cancel
        </button>
      </form>
    </div>
  );
}

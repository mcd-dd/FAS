export default function FireControlDashboard({ incident }) {
    const [loadingAction, setLoadingAction] = useState(false);  /* Add this */


{/* ACTION BUTTONS */}
<div className="flex gap-4 mt-4">

<button
  disabled={loadingAction}
  onClick={async () => {
    try {
      setLoadingAction(true);
      await sendOperatorAction({
        incident_id: incident.id,
        action: "ACCEPT",
        station_id: user.station_id,
        user: user.username
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingAction(false);
    }
  }}
  className="bg-green-600 px-4 py-2 rounded disabled:opacity-50"
>
  Accept
</button>

<button
  disabled={loadingAction}
  onClick={async () => {
    try {
      setLoadingAction(true);
      await sendOperatorAction({
        incident_id: incident.id,
        action: "DESPATCH",
        station_id: user.station_id,
        user: user.username
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingAction(false);
    }
  }}
  className="bg-orange-500 px-4 py-2 rounded disabled:opacity-50"
>
  Dispatch
</button>

<button
  disabled={loadingAction}
  onClick={async () => {
    try {
      setLoadingAction(true);
      await sendOperatorAction({
        incident_id: incident.id,
        action: "REJECT",
        station_id: user.station_id,
        user: user.username
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingAction(false);
    }
  }}
  className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
>
  Reject
</button>

</div>
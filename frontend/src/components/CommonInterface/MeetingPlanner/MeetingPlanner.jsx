import React, { useState } from "react";
import { CalendarDays, Check, Clock3, MapPin, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import {
  useAcceptRequestSchedule,
  useActiveMeetingLocations,
  useProposeRequestSchedule,
} from "../../../hooks/useBuyerQueries";
import "./MeetingPlanner.css";

const currentUserId = () => {
  try { return JSON.parse(localStorage.getItem("campusrecycleuser"))?._id; }
  catch { return null; }
};

function MeetingPlanner({ requestId, schedule, onChanged }) {
  const locationsQuery = useActiveMeetingLocations();
  const proposeMeeting = useProposeRequestSchedule();
  const acceptMeeting = useAcceptRequestSchedule();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ locationId: "", date: "", time: "" });
  const locations = locationsQuery.data || [];
  const selectedLocation = locations.find((location) => location._id === form.locationId);
  const minimumDate = new Date().toLocaleDateString("en-CA");
  const status = schedule ? (schedule.status || "confirmed") : "none";
  const proposedByMe = schedule?.proposedBy && String(schedule.proposedBy) === String(currentUserId());
  const locationName = schedule?.locationSnapshot?.name || schedule?.venue;

  const readableDate = (() => {
    if (!schedule?.date) return "";
    const parsed = new Date(`${schedule.date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? schedule.date : new Intl.DateTimeFormat("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    }).format(parsed);
  })();

  const submitProposal = async (event) => {
    event.preventDefault();
    try {
      await proposeMeeting.mutateAsync({ requestid: requestId, ...form });
      toast.success(schedule ? "Counter-proposal sent" : "Meeting proposal sent");
      setEditing(false);
      onChanged?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Could not send proposal");
    }
  };

  const acceptProposal = async () => {
    try {
      await acceptMeeting.mutateAsync(requestId);
      toast.success("Meeting confirmed");
      onChanged?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Could not confirm meeting");
    }
  };

  return (
    <div className="meeting-planner">
      {schedule && !editing && (
        <>
          <div className={`meeting-planner-status meeting-planner-status--${status}`}>
            {status === "confirmed" ? <Check size={16} /> : <Clock3 size={16} />}
            <div>
              <strong>{status === "confirmed" ? "Meeting confirmed" : proposedByMe ? "Waiting for their response" : "New meeting proposal"}</strong>
              <span>{status === "confirmed" ? "Both participants agreed to these details." : proposedByMe ? "The other participant can accept or suggest another time." : "Accept it or suggest a different place and time."}</span>
            </div>
          </div>

          <div className="meeting-planner-details">
            <p><MapPin size={18} /><span><b>{locationName}</b><small>{schedule.locationSnapshot?.address || "Approved campus meeting point"}</small></span></p>
            <p><CalendarDays size={18} /><span><b>{readableDate}</b><small>{schedule.time}</small></span></p>
          </div>

          {status === "proposed" && (
            <div className="meeting-planner-actions">
              {!proposedByMe && <button type="button" className="meeting-primary" onClick={acceptProposal} disabled={acceptMeeting.isPending}><Check size={16} /> {acceptMeeting.isPending ? "Confirming…" : "Accept proposal"}</button>}
              <button type="button" className="meeting-secondary" onClick={() => setEditing(true)}><RefreshCw size={15} /> Suggest another</button>
            </div>
          )}
        </>
      )}

      {(!schedule || editing) && (
        <form className="meeting-planner-form" onSubmit={submitProposal}>
          <div className="meeting-planner-intro">
            <span>{schedule ? "Counter-proposal" : "Start with a proposal"}</span>
            <h4>Choose a place and time</h4>
            <p>The meeting is only confirmed after the other participant accepts.</p>
          </div>
          <label>
            Campus meeting point
            <select name="locationId" value={form.locationId} onChange={(event) => setForm((value) => ({ ...value, locationId: event.target.value, time: "" }))} required>
              <option value="">Select an approved location</option>
              {locations.map((location) => <option key={location._id} value={location._id}>{location.name} · {location.startTime}–{location.endTime}</option>)}
            </select>
          </label>
          {selectedLocation?.address && <p className="meeting-location-note"><MapPin size={14} /> {selectedLocation.address}</p>}
          <div className="meeting-planner-grid">
            <label>Date<input type="date" value={form.date} min={minimumDate} onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))} required /></label>
            <label>Time<input type="time" value={form.time} min={selectedLocation?.startTime} max={selectedLocation?.endTime} onChange={(event) => setForm((value) => ({ ...value, time: event.target.value }))} disabled={!selectedLocation} required /></label>
          </div>
          <div className="meeting-planner-actions">
            {schedule && <button type="button" className="meeting-secondary" onClick={() => setEditing(false)}>Cancel</button>}
            <button type="submit" className="meeting-primary" disabled={!form.locationId || !form.date || !form.time || proposeMeeting.isPending}>{proposeMeeting.isPending ? "Sending…" : schedule ? "Send counter-proposal" : "Send proposal"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default MeetingPlanner;

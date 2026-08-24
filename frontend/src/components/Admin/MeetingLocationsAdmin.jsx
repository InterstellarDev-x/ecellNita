import React, { useState } from "react";
import { MapPin, Pencil, Power, Plus } from "lucide-react";
import { useDeactivateMeetingLocation, useSaveMeetingLocation } from "../../hooks/useAdminQueries";

const blank = { name: "", address: "", startTime: "", endTime: "" };

function MeetingLocationsAdmin({ locations, onError, readOnly = false }) {
  const [values, setValues] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const save = useSaveMeetingLocation();
  const deactivate = useDeactivateMeetingLocation();
  const edit = (location) => { setEditingId(location._id); setValues({ name: location.name, address: location.address, startTime: location.startTime, endTime: location.endTime }); };
  const submit = async (event) => { event.preventDefault(); try { await save.mutateAsync({ locationId: editingId, values }); setEditingId(null); setValues(blank); } catch (error) { onError(error.message || "Could not save location."); } };
  const setActive = async (location) => { try { if (location.active) await deactivate.mutateAsync(location._id); else await save.mutateAsync({ locationId: location._id, values: { name: location.name, address: location.address, startTime: location.startTime, endTime: location.endTime, active: true } }); } catch (error) { onError(error.message || "Could not update location."); } };

  return <section className="admin-settings">
    {!readOnly && <section className="admin-panel"><div className="admin-panel-head"><div><span>Approved venues</span><h2>{editingId ? "Edit meeting location" : "Add meeting location"}</h2></div><MapPin size={22} /></div><p>Sellers choose an exact time, but the server permits it only inside this location’s range.</p>
      <form className="admin-location-form" onSubmit={submit}><label>Name<input required value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="e.g. Library Gate" /></label><label>Address or guidance<input required value={values.address} onChange={(event) => setValues({ ...values, address: event.target.value })} placeholder="Near the central library entrance" /></label><label>Start time<input required type="time" value={values.startTime} onChange={(event) => setValues({ ...values, startTime: event.target.value })} /></label><label>End time<input required type="time" value={values.endTime} onChange={(event) => setValues({ ...values, endTime: event.target.value })} /></label><div><button type="button" className="admin-form-cancel" onClick={() => { setEditingId(null); setValues(blank); }}>Cancel</button><button type="submit" disabled={save.isPending}>{editingId ? "Save changes" : <><Plus size={16} /> Add location</>}</button></div></form>
    </section>}
    <section className="admin-panel"><div className="admin-panel-head"><div><span>Current availability</span><h2>{locations.length} locations</h2></div></div><div className="admin-location-list">{locations.map((location) => <article key={location._id} className={!location.active ? "is-inactive" : ""}><MapPin size={19} /><div><strong>{location.name}</strong><p>{location.address} · {location.startTime}–{location.endTime}</p></div><span className={`admin-pill ${location.active ? "active" : "suspended"}`}>{location.active ? "Active" : "Inactive"}</span>{!readOnly && <><button onClick={() => edit(location)} aria-label={`Edit ${location.name}`}><Pencil size={15} /></button><button onClick={() => setActive(location)} aria-label={`${location.active ? "Deactivate" : "Activate"} ${location.name}`}><Power size={15} /></button></>}</article>)}{locations.length === 0 && <p className="admin-empty">No meeting locations have been added.</p>}</div></section>
  </section>;
}

export default MeetingLocationsAdmin;

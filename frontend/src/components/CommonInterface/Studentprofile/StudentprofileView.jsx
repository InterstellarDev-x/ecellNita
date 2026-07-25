import React, { useEffect, useState } from "react";
import "./StudentprofileView.css";
import { AlertCircle, Camera, CheckCircle2, Pencil, Save, X } from "lucide-react";
import Spinner from "react-bootstrap/Spinner";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";

const getProfileDetails = (user) => user?.additionaldetails || {};
const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
const MAX_IMAGE_SIZE_MB = 2;

const buildProfileFormData = (user) => {
  const profile = getProfileDetails(user);

  return {
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    gender: profile.gender || user?.gender || '',
    enrollmentno: profile.enrollmentno || user?.enrollmentno || '',
    contactno: profile.contactno || user?.contactno || '',
    about: profile.about || user?.about || '',
    graduationyr: profile.graduationyr || user?.graduationyr || '',
  };
};

function StudentprofileView() {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [updateProfileFormdata, setUpdateProfileFormdata] = useState({
    firstname: '',
    lastname: '',
    gender: '',
    enrollmentno: '',
    contactno: '',
    about: '',
    graduationyr: '',
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('campusrecycleuser'));
    setUserDetails(user);
    if (user) {
      setUpdateProfileFormdata(buildProfileFormData(user));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const currentProfileFormData = buildProfileFormData(userDetails);
  const hasFormChanges = profileImageFile || Object.keys(updateProfileFormdata).some(
    (key) => String(updateProfileFormdata[key] || "") !== String(currentProfileFormData[key] || "")
  );

  const startEditing = () => {
    setStatusMessage({ type: "", message: "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (loading) return;
    if (userDetails) {
      setUpdateProfileFormdata(buildProfileFormData(userDetails));
    }
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImageFile(null);
    setProfileImagePreview("");
    setStatusMessage({ type: "", message: "" });
    setIsEditing(false);
  };

  const updateProfileFormdataOnchange = (e) => {
    setStatusMessage({ type: "", message: "" });
    setUpdateProfileFormdata({ ...updateProfileFormdata, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", message: "Please upload a valid image file." });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setStatusMessage({ type: "error", message: `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.` });
      e.target.value = "";
      return;
    }

    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setStatusMessage({ type: "", message: "" });
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const updateUser = async (updatedProfile) => {
    const api_header = {
      Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
      "Content-Type": "multipart/form-data",
    };
    const userFormData = new FormData();
    userFormData.append("firstname", updateProfileFormdata.firstname.trim());
    userFormData.append("lastname", updateProfileFormdata.lastname.trim());
    if (profileImageFile) {
      userFormData.append("userimage", profileImageFile);
    }

    const responseObj = await apiConnector("POST", authroutes.UPDATE_USER, userFormData, api_header);
    if (!responseObj.data.success) {
      throw new Error(responseObj.data.message || "Could not update user details");
    }

    return {
      ...responseObj.data.data,
      additionaldetails: updatedProfile || responseObj.data.data.additionaldetails,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasFormChanges) {
      setStatusMessage({ type: "info", message: "No changes to save." });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: "", message: "" });
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const profilePayload = {
        gender: updateProfileFormdata.gender,
        enrollmentno: String(updateProfileFormdata.enrollmentno || "").trim(),
        contactno: String(updateProfileFormdata.contactno || "").trim(),
        about: String(updateProfileFormdata.about || "").trim(),
        graduationyr: updateProfileFormdata.graduationyr,
      };
      const responseObj = await apiConnector("POST", authroutes.UPDATE_PROFILE, profilePayload, api_header);
      if (!responseObj.data.success) {
        throw new Error(responseObj.data.message || "Could not update profile details");
      }

      const updatedUser = await updateUser(responseObj.data.data);
      localStorage.setItem('campusrecycleuser', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("campusrecycleuser-updated"));
      setUserDetails(updatedUser);
      setUpdateProfileFormdata(buildProfileFormData(updatedUser));
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
      setProfileImageFile(null);
      setProfileImagePreview("");
      setIsEditing(false);
      setStatusMessage({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      console.log(error);
      setStatusMessage({ type: "error", message: error.message || "Something went wrong while updating your profile." });
    } finally {
      setLoading(false);
    }
  };

  const YEAR_LABELS = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
  const profileDetails = getProfileDetails(userDetails);

  return (
    <div className="profile-view">
      <div className="top" />

      <div className="profile-avatar-wrap">
        <img
          src={profileImagePreview || userDetails?.image || DEFAULT_PROFILE_IMAGE}
          alt="Profile"
          className="profile-avatar"
        />
      </div>

      <div className="profile-details">
        <div>
          <h4>{userDetails ? `${userDetails.firstname} ${userDetails.lastname}` : '—'}</h4>
          <p>{userDetails?.email}</p>
        </div>
        {!isEditing && (
          <button className="profile-edit-btn" onClick={startEditing}>
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="edit-profile-section">
        {statusMessage.message && !isEditing && (
          <div className={`profile-alert profile-alert-${statusMessage.type}`}>
            {statusMessage.type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            <span>{statusMessage.message}</span>
          </div>
        )}

        {!isEditing ? (
          <div className="profile-info-card">
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="info-label">First Name</span>
                <span className="info-value">{userDetails?.firstname || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Last Name</span>
                <span className="info-value">{userDetails?.lastname || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Gender</span>
                <span className="info-value">{profileDetails.gender || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Enrollment No.</span>
                <span className="info-value">{profileDetails.enrollmentno || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Contact No.</span>
                <span className="info-value">{profileDetails.contactno || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Graduation Year</span>
                <span className="info-value">{YEAR_LABELS[profileDetails.graduationyr] || profileDetails.graduationyr || '—'}</span>
              </div>
              {profileDetails.about && (
                <div className="profile-info-item full-width">
                  <span className="info-label">About</span>
                  <span className="info-value">{profileDetails.about}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="edit-profile-form">
            <div className="edit-form-header">
              <div>
                <h3 className="edit-form-title">Edit Profile</h3>
                <p>Keep your profile details fresh and accurate.</p>
              </div>
              {hasFormChanges && <span className="unsaved-badge">Unsaved changes</span>}
            </div>

            {statusMessage.message && (
              <div className={`profile-alert profile-alert-${statusMessage.type}`}>
                {statusMessage.type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                <span>{statusMessage.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="edit-profile-input-1">
                <div className="profile-image-upload">
                  <img
                    src={profileImagePreview || userDetails?.image || DEFAULT_PROFILE_IMAGE}
                    alt="Profile preview"
                  />
                  <div>
                    <label htmlFor="userimage">Profile image</label>
                    <input
                      type="file"
                      id="userimage"
                      name="userimage"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                    />
                    <span>{profileImageFile ? profileImageFile.name : `JPG/PNG/WebP up to ${MAX_IMAGE_SIZE_MB}MB. Square image works best.`}</span>
                  </div>
                  <label className="profile-image-upload-btn" htmlFor="userimage">
                    <Camera size={16} />
                    Change
                  </label>
                </div>

                <div className="form-row">
                  <div>
                    <label htmlFor="firstname">First Name</label>
                    <input type="text" id="firstname" name="firstname" value={updateProfileFormdata.firstname} onChange={updateProfileFormdataOnchange} disabled={loading} required />
                  </div>
                  <div>
                    <label htmlFor="lastname">Last Name</label>
                    <input type="text" id="lastname" name="lastname" value={updateProfileFormdata.lastname} onChange={updateProfileFormdataOnchange} disabled={loading} required />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" name="gender" value={updateProfileFormdata.gender} onChange={updateProfileFormdataOnchange} disabled={loading} required>
                      <option value="">Choose gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="graduationyr">Graduation Year</label>
                    <select id="graduationyr" name="graduationyr" value={updateProfileFormdata.graduationyr} onChange={updateProfileFormdataOnchange} disabled={loading} required>
                      <option value="">Choose year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="enrollmentno">Enrollment No.</label>
                  <input type="text" id="enrollmentno" name="enrollmentno" value={updateProfileFormdata.enrollmentno} onChange={updateProfileFormdataOnchange} disabled={loading} required />
                </div>

                <div>
                  <label htmlFor="contactno">Contact No.</label>
                  <input type="tel" id="contactno" name="contactno" value={updateProfileFormdata.contactno} onChange={updateProfileFormdataOnchange} disabled={loading} pattern="[0-9]{10}" title="Enter a 10 digit contact number" required />
                </div>

                <div>
                  <label htmlFor="about">About</label>
                  <textarea rows={4} id="about" name="about" value={updateProfileFormdata.about} onChange={updateProfileFormdataOnchange} disabled={loading} maxLength={240} />
                  <span className="field-hint">{updateProfileFormdata.about.length}/240 characters</span>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={handleCancel} disabled={loading}>
                    <X size={16} />
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || !hasFormChanges} className="btn-save">
                    {loading ? <><Spinner size="sm" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentprofileView;

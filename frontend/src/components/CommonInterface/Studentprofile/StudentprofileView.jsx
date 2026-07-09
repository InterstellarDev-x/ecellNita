import React, { useEffect, useState } from "react";
import "./StudentprofileView.css";
import { Camera, Pencil } from "lucide-react";
import Spinner from "react-bootstrap/Spinner";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";

const getProfileDetails = (user) => user?.additionaldetails || {};

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

  const handleCancel = () => {
    if (userDetails) {
      setUpdateProfileFormdata(buildProfileFormData(userDetails));
    }
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImageFile(null);
    setProfileImagePreview("");
    setIsEditing(false);
  };

  const updateProfileFormdataOnchange = (e) => {
    setUpdateProfileFormdata({ ...updateProfileFormdata, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const updateUser = async () => {
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const userFormData = new FormData();
      userFormData.append("firstname", updateProfileFormdata.firstname);
      userFormData.append("lastname", updateProfileFormdata.lastname);
      if (profileImageFile) {
        userFormData.append("userimage", profileImageFile);
      }

      const responseObj = await apiConnector("POST", authroutes.UPDATE_USER, userFormData, api_header);
      if (responseObj.data.success) {
        const updatedUser = responseObj.data.data;
        localStorage.setItem('campusrecycleuser', JSON.stringify(updatedUser));
        setUserDetails(updatedUser);
        if (profileImagePreview) {
          URL.revokeObjectURL(profileImagePreview);
        }
        setProfileImageFile(null);
        setProfileImagePreview("");
        setLoading(false);
        setIsEditing(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const responseObj = await apiConnector("POST", authroutes.UPDATE_PROFILE, updateProfileFormdata, api_header);
      if (responseObj.data.success) {
        updateUser();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
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
          src={userDetails?.image || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
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
          <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="edit-profile-section">
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
            <h3 className="edit-form-title">Edit Profile</h3>
            <form onSubmit={handleSubmit}>
              <div className="edit-profile-input-1">
                <div className="profile-image-upload">
                  <img
                    src={profileImagePreview || userDetails?.image || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
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
                    <span>Upload a square image for the best fit.</span>
                  </div>
                  <label className="profile-image-upload-btn" htmlFor="userimage">
                    <Camera size={16} />
                    Change
                  </label>
                </div>

                <div className="form-row">
                  <div>
                    <label htmlFor="firstname">First Name</label>
                    <input type="text" id="firstname" name="firstname" value={updateProfileFormdata.firstname} onChange={updateProfileFormdataOnchange} required />
                  </div>
                  <div>
                    <label htmlFor="lastname">Last Name</label>
                    <input type="text" id="lastname" name="lastname" value={updateProfileFormdata.lastname} onChange={updateProfileFormdataOnchange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" name="gender" value={updateProfileFormdata.gender} onChange={updateProfileFormdataOnchange} required>
                      <option value="">Choose gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="graduationyr">Graduation Year</label>
                    <select id="graduationyr" name="graduationyr" value={updateProfileFormdata.graduationyr} onChange={updateProfileFormdataOnchange} required>
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
                  <input type="text" id="enrollmentno" name="enrollmentno" value={updateProfileFormdata.enrollmentno} onChange={updateProfileFormdataOnchange} required />
                </div>

                <div>
                  <label htmlFor="contactno">Contact No.</label>
                  <input type="number" id="contactno" name="contactno" value={updateProfileFormdata.contactno} onChange={updateProfileFormdataOnchange} required />
                </div>

                <div>
                  <label htmlFor="about">About</label>
                  <textarea rows={4} id="about" name="about" value={updateProfileFormdata.about} onChange={updateProfileFormdataOnchange} />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                  <button type="submit" disabled={loading} className="btn-save">
                    {loading ? <Spinner size="sm" /> : 'Save Changes'}
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

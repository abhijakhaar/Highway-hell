import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export const ProfileCard = ({
  user,
  isFriend,
  isCurrentUser,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const friendId = user._id;
  console.log(friendId);
   const [isLoading, setIsLoading] = useState(false);
  const [errorInAddingFriend, setErrorInAddingFriend] = useState(null);
  const [ success , setSuccess ] = useState(false);

  const handleAddFriend = async (user) => {
    setIsLoading(true); // Start loading
    setErrorInAddingFriend(null); // Reset any previous error

    try {
      const response = await fetch("http://localhost:3001/users/add-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token"), // Make sure to send the token
        },
        body: JSON.stringify({ friendId: friendId }),
      });

      if (response.ok) {
        alert(`Friend request has been sent to ${user.name}.`);
        setSuccess(true);
      } else {
        const data = await response.json();
        alert(`${data.error}`);
      }
    } catch (error) {
      setErrorInAddingFriend("Error adding friend. Please try again later.");
      console.error("Error adding friend:", error);
    } finally {
      setIsLoading(false); // Stop loading once done
    }
  };
    const handleRemoveFriend = async () => {
    try {
      setLoading(true);
      // Send the friend's email to the backend to remove the friend.
      const response = await fetch(
        `http://localhost:3001/users/removeFriend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          // Use user.useremail (or user.email) as needed by your backend.
          body: JSON.stringify({
            useremail : user.useremail,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove friend");
      }
      // Optionally trigger any update to refresh the friends list.
      // onFriendUpdate();
      // Optionally navigate or show a success message.
      alert("Friend removed successfully");
      navigate(`/profile/${currentUser._id}`);
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Failed to remove friend");
    } finally {
      setLoading(false);
    }
  };
  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-4 border border-gray-300">
      {/* Banner Image */}
      <div className="h-36 bg-gradient-to-r from-blue-500 to-purple-600 w-full relative">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url(${
              user.coverImage || "/images/default-cover.jpg"
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
      </div>

      <div className="px-6 pb-6 relative">
        {/* Profile Picture */}
        <div className="absolute -top-12 left-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
            <img
              src={user.profileImage || "/images/default-profile.png"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>

            {/* Friend Actions */}
            <div className="flex gap-2">
              {isCurrentUser ? (
                <button
                  onClick={handleEditProfile}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm shadow-md"
                >
                  Edit Profile
                </button>
              ) : isFriend ? (
                <>
                  <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2 rounded-full text-sm shadow-md">
                    Send Message
                  </button>
                  <button
                    onClick={handleRemoveFriend}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-sm shadow-md disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Remove Friend"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm shadow-md disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Add Friend"}
                </button>
              )}
            </div>
          </div>
        </div>

        <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
          @{user.username}
        </span>

        <div className="mt-4 space-y-2">
          {user.occupation && (
            <p className="text-gray-600">{user.occupation}</p>
          )}
          {user.location && <p className="text-gray-600">{user.location}</p>}
        </div>
      </div>
    </div>
  );
};

export const FriendsCard = ({ friends = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-300">
      <h2 className="text-xl font-bold text-gray-800">Friends</h2>
      {friends.length === 0 ? (
        <p className="text-gray-500">No friends added yet.</p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {friends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center gap-4 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition"
              onClick={() => navigate(`/profile/${friend._id}`)}
            >
              <img
                src={friend.profileImage || "/images/default-profile.png"}
                alt={friend.name}
                className="w-12 h-12 rounded-full shadow-md"
              />
              <p className="text-gray-800 font-medium">{friend.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AboutCard = ({ about }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-300">
    <h2 className="text-xl font-bold text-gray-800">About Me</h2>
    {about ? (
      <p className="text-gray-700 mt-3 leading-relaxed">{about}</p>
    ) : (
      <p className="text-gray-500 mt-3 italic">
        No about information available
      </p>
    )}
  </div>
);

export const ConnectCard = ({ connect }) => {
  const links = [
    {
      platform: "Leetcode",
      url: connect?.leetcode,
      icon: "/images/leetcode.png",
    },
    {
      platform: "Instagram",
      url: connect?.instagram,
      icon: "/images/instagram.png",
    },
    {
      platform: "LinkedIn",
      url: connect?.linkedin,
      icon: "/images/linkedin.png",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-300">
      <h2 className="text-xl font-bold text-gray-800">Connect</h2>
      <div className="flex flex-col gap-3 mt-4">
        {links
          .filter((link) => link.url)
          .map((link) => (
            <div key={link.platform} className="flex items-center gap-2">
              <img
                src={link.icon}
                alt={`${link.platform} Icon`}
                className="w-4 h-4"
              />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-md"
              >
                {link.platform}
              </a>
            </div>
          ))}
      </div>
    </div>
  );
};

export const LocationCard = ({ location }) =>
  location ? (
    <div className="bg-white rounded-2xl shadow-lg p-6 py-4 border border-gray-300">
      <h2 className="text-xl font-bold text-gray-800">Location</h2>
      <div className="flex items-center gap-2 mt-3">
        <img
          src="/images/location.png"
          alt="Location Icon"
          className="w-4 h-4"
        />
        <span className="text-gray-700">{location}</span>
      </div>
    </div>
  ) : null;

{/* ROLE-BASED NAVIGATION */}
<nav className="flex-1 flex flex-col gap-3 text-right">


{/* STATION + NFS */}
{(user?.role === "STATION" ||
    user?.role === "NFS") && (
    <Link to="/incidents" className={linkClass("/incidents")}>
    Incidents
    </Link>
)}


{/* VEHICLE OPERATOR */}
{user?.role === "VEHICLE_OPERATOR" && (
    <Link
    to="/vehicle-dashboard"
    className={linkClass("/vehicle-dashboard")}
    >
    My Vehicle Incidents
    </Link>
)}

{/* NFS ADMIN ONLY */}
{user?.role === "NFS_ADMIN" && (
    <Link to="/register" className={linkClass("/register")}>
    Register Device
    </Link>
)}

</nav>


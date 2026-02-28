        {/* FIRE STATION */}
        {user?.role === "STATION" && (
            <Link to="/vehicles" className={linkClass("/vehicles")}>
              Manage Vehicles
            </Link>
          )}
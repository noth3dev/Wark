"use client";

import { GoogleDriveProvider } from "../../lib/google-drive-context";
import DriveExplorer from "../../components/drive/DriveExplorer";

export default function DrivePage() {
    return (
        <GoogleDriveProvider>
            <DriveExplorer />
        </GoogleDriveProvider>
    );
}

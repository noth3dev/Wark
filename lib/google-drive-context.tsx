"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";

export interface GoogleAccount {
    id: string; // email
    name: string;
    accessToken: string;
    avatar?: string;
}

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    accountId: string; // Mapping to Google account email
    size?: string;
    modifiedTime?: string;
    createdTime?: string;
    iconLink?: string;
    thumbnailLink?: string;
    webViewLink?: string;
    webContentLink?: string;
    parents?: string[];
    shared?: boolean;
    starred?: boolean;
    tags?: string[];
    notes?: string;
}

export interface DriveChamber {
    id: string;
    name: string;
    root_folder_id: string;
    account_id: string;
}

interface GoogleDriveContextType {
    // Multi-account
    accounts: GoogleAccount[];
    activeAccount: GoogleAccount | null;
    addAccount: () => void;
    switchAccount: (accountId: string) => void;
    removeAccount: (accountId: string) => void;
    isLoading: boolean;

    // Drive API
    listFiles: (folderId?: string, query?: string) => Promise<DriveFile[]>;
    uploadFile: (file: File, folderId?: string, accountId?: string) => Promise<DriveFile | null>;
    deleteFile: (fileId: string, accountId?: string) => Promise<boolean>;
    createFolder: (name: string, parentId?: string, accountId?: string) => Promise<DriveFile | null>;
    downloadFile: (fileId: string, fileName: string, mimeType: string, accountId?: string) => Promise<void>;
    starFile: (fileId: string, starred: boolean, accountId?: string) => Promise<boolean>;
    renameFile: (fileId: string, newName: string, accountId?: string) => Promise<boolean>;
    getFileBlob: (fileId: string, accountId?: string) => Promise<string | null>;
    getStorageQuota: (accountId?: string) => Promise<{ usage: number; limit: number } | null>;
    updateMetadata: (fileId: string, metadata: { tags?: string[]; notes?: string }) => Promise<void>;
    moveFile: (fileId: string, fromParentId: string, toFolderId: string, accountId?: string) => Promise<boolean>;
    shareFile: (fileId: string, accountId?: string) => Promise<string | null>;
    clearCache: () => void;

    // Chambers
    chambers: DriveChamber[];
    activeChamber: DriveChamber | null;
    setActiveChamber: (chamber: DriveChamber | null) => void;
    createChamber: (name: string, folderId: string) => Promise<void>;
    removeChamber: (chamberId: string) => Promise<void>;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

export function GoogleDriveProvider({ children }: { children: React.ReactNode }) {
    const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
    const [activeAccount, setActiveAccount] = useState<GoogleAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const listCache = useRef<Map<string, { data: DriveFile[], timestamp: number }>>(new Map());

    // Initial load
    useEffect(() => {
        const saved = localStorage.getItem("google_drive_accounts");
        if (saved) {
            const parsed = JSON.parse(saved);
            setAccounts(parsed);
            if (parsed.length > 0) setActiveAccount(parsed[0]);
        }
        setIsLoading(false);
    }, []);

    // Save on change
    useEffect(() => {
        localStorage.setItem("google_drive_accounts", JSON.stringify(accounts));
    }, [accounts]);

    const addAccount = () => {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
            callback: async (response: any) => {
                if (response.access_token) {
                    // Fetch profile
                    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                        headers: { Authorization: `Bearer ${response.access_token}` },
                    });
                    const profile = await res.json();
                    
                    const newAcc: GoogleAccount = {
                        id: profile.email,
                        name: profile.name,
                        accessToken: response.access_token,
                        avatar: profile.picture,
                    };

                    setAccounts(prev => {
                        const filtered = prev.filter(a => a.id !== newAcc.id);
                        return [...filtered, newAcc];
                    });
                    setActiveAccount(newAcc);
                }
            },
        });
        client.requestAccessToken();
    };

    const switchAccount = (accountId: string) => {
        const acc = accounts.find(a => a.id === accountId);
        if (acc) setActiveAccount(acc);
    };

    const removeAccount = (accountId: string) => {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
        if (activeAccount?.id === accountId) {
            setActiveAccount(accounts.find(a => a.id !== accountId) || null);
        }
    };

    const headers = useCallback((accountId?: string): Record<string, string> => {
        const acc = accountId ? accounts.find(a => a.id === accountId) : activeAccount;
        if (!acc) return {};
        return { Authorization: `Bearer ${acc.accessToken}` };
    }, [accounts, activeAccount]);

    const [chambers, setChambers] = useState<DriveChamber[]>([]);
    const [activeChamber, setActiveChamber] = useState<DriveChamber | null>(null);

    const fetchChambers = useCallback(async () => {
        if (accounts.length === 0) return;
        const emails = accounts.map(a => a.id);
        const { data } = await supabase
            .from("drive_chambers")
            .select("*")
            .in("account_id", emails);
        if (data) setChambers(data);
    }, [accounts]);

    useEffect(() => {
        fetchChambers();
    }, [fetchChambers]);

    const createChamber = async (name: string, folderId: string) => {
        if (!activeAccount) return;
        await supabase.from("drive_chambers").insert({
            name,
            root_folder_id: folderId,
            account_id: activeAccount.id,
        });
        fetchChambers();
    };

    const removeChamber = async (chamberId: string) => {
        await supabase.from("drive_chambers").delete().eq("id", chamberId);
        if (activeChamber?.id === chamberId) setActiveChamber(null);
        fetchChambers();
    };

    const listFiles = useCallback(
        async (folderId?: string, query?: string): Promise<DriveFile[]> => {
            const parts: string[] = ["trashed = false"];
            const rootId = folderId || (activeChamber ? activeChamber.root_folder_id : "root");
            
            if (rootId !== "all" && rootId !== "root") {
                parts.push(`'${rootId}' in parents`);
            }
            if (query) parts.push(`name contains '${query}'`);
            const q = encodeURIComponent(parts.join(" and "));

            const fetchFromAccount = async (acc: GoogleAccount): Promise<DriveFile[]> => {
                const cacheKey = `${acc.id}:${rootId}:${query || ""}`;
                const cached = listCache.current.get(cacheKey);
                
                // Cache valid for 30 seconds
                if (cached && (Date.now() - cached.timestamp < 30000)) {
                    return cached.data;
                }

                try {
                    const res = await fetch(
                        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,iconLink,thumbnailLink,webViewLink,webContentLink,parents,shared,starred)&orderBy=folder,modifiedTime desc&pageSize=100`,
                        { headers: { Authorization: `Bearer ${acc.accessToken}` } }
                    );
                    if (!res.ok) return [];
                    const data = await res.json();
                    const files = (data.files || []) as DriveFile[];
                    
                    if (files.length === 0) {
                        listCache.current.set(cacheKey, { data: [], timestamp: Date.now() });
                        return [];
                    }

                    // Attach metadata and account ID
                    const { data: metaRows } = await supabase
                        .from("drive_metadata")
                        .select("*")
                        .in("file_id", files.map((f: DriveFile) => f.id));

                    const finalFiles = files.map((f: DriveFile) => ({
                        ...f,
                        accountId: acc.id,
                        tags: metaRows?.find(m => m.file_id === f.id)?.tags || [],
                        notes: metaRows?.find(m => m.file_id === f.id)?.notes || "",
                    }));

                    listCache.current.set(cacheKey, { data: finalFiles, timestamp: Date.now() });
                    return finalFiles;
                } catch (e) {
                    console.error("List files fetch error", e);
                    return [];
                }
            };

            if (activeChamber) {
                const acc = accounts.find(a => a.id === activeChamber.account_id);
                if (!acc) return [];
                return fetchFromAccount(acc);
            }

            if (rootId === "all" || rootId === "root") {
                const results = await Promise.all(accounts.map(fetchFromAccount));
                return results.flat();
            }

            if (!activeAccount) return [];
            return fetchFromAccount(activeAccount);
        },
        [activeAccount, accounts, activeChamber]
    );

    // Clear cache helper
    const clearCache = useCallback(() => {
        listCache.current.clear();
    }, []);

    const uploadFile = async (file: File, folderId: string = "root", accountId?: string) => {
        const accId = accountId || (activeChamber ? activeChamber.account_id : activeAccount?.id);
        if (!accId) return null;

        const metadata = { name: file.name, parents: [folderId === "root" ? "root" : folderId] };
        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", file);

        const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,createdTime,iconLink,thumbnailLink,webViewLink,webContentLink,parents,shared,starred", {
            method: "POST",
            headers: headers(accId),
            body: form,
        });

        if (!res.ok) return null;
        const data = await res.json();
        return { ...data, accountId: accId };
    };

    const deleteFile = async (fileId: string, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        if (!accId) return false;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "DELETE",
            headers: headers(accId),
        });
        return res.ok;
    };

    const createFolder = async (name: string, parentId: string = "root", accountId?: string) => {
        const accId = accountId || (activeChamber ? activeChamber.account_id : activeAccount?.id);
        if (!accId) return null;
        const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,size,modifiedTime,createdTime,iconLink,thumbnailLink,webViewLink,webContentLink,parents,shared,starred", {
            method: "POST",
            headers: { ...headers(accId), "Content-Type": "application/json" },
            body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { ...data, accountId: accId };
    };

    const starFile = async (fileId: string, starred: boolean, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        if (!accId) return false;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "PATCH",
            headers: { ...headers(accId), "Content-Type": "application/json" },
            body: JSON.stringify({ starred }),
        });
        return res.ok;
    };

    const renameFile = async (fileId: string, newName: string, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        if (!accId) return false;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "PATCH",
            headers: { ...headers(accId), "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
        });
        return res.ok;
    };

    const getFileBlob = async (fileId: string, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        if (!accId) return null;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: headers(accId),
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    };

    const downloadFile = async (fileId: string, name: string, mimeType: string, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        const exportMap: Record<string, string> = {
            "application/vnd.google-apps.document": "application/pdf",
            "application/vnd.google-apps.spreadsheet": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.google-apps.presentation": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        };
        const exportMime = exportMap[mimeType];
        const url = exportMime
            ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`
            : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

        const res = await fetch(url, { headers: headers(accId) });
        if (!res.ok) return;
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = exportMime ? name.replace(/\.[^.]+$/, "") + (exportMime.includes("pdf") ? ".pdf" : ".xlsx") : name;
        a.click();
        URL.revokeObjectURL(blobUrl);
    };

    const getStorageQuota = useCallback(async (accountId?: string) => {
        // If specific account requested
        if (accountId) {
            const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota", {
                headers: headers(accountId),
            });
            if (!res.ok) return null;
            const data = await res.json();
            return { usage: parseInt(data.storageQuota.usage, 10), limit: parseInt(data.storageQuota.limit, 10) };
        }
        
        // Sum ALL accounts for unified total
        if (accounts.length === 0) return { usage: 0, limit: 0 };

        const quotas = await Promise.all(accounts.map(async acc => {
            try {
                const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota", {
                    headers: { Authorization: `Bearer ${acc.accessToken}` },
                });
                if (!res.ok) return { usage: 0, limit: 0 };
                const data = await res.json();
                return { usage: parseInt(data.storageQuota.usage, 10), limit: parseInt(data.storageQuota.limit, 10) };
            } catch {
                return { usage: 0, limit: 0 };
            }
        }));
        
        return quotas.reduce((acc, curr) => ({ 
            usage: acc.usage + curr.usage, 
            limit: acc.limit + curr.limit 
        }), { usage: 0, limit: 0 });
    }, [headers, accounts]);

    const updateMetadata = async (fileId: string, meta: { tags?: string[]; notes?: string }) => {
        await supabase.from("drive_metadata").upsert(
            { file_id: fileId, ...meta, updated_at: new Date().toISOString() },
            { onConflict: "file_id" }
        );
    };

    const moveFile = async (fileId: string, fromParentId: string, toParentId: string, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        if (!accId) return false;
        
        try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${toParentId}&removeParents=${fromParentId}`, {
                method: "PATCH",
                headers: headers(accId),
            });
            
            if (res.ok) {
                // If the move was for the currently viewed folder, we need to refresh listFiles
                // The caller in DriveExplorer usually handles this, but we'll return ok
                return true;
            }
            return false;
        } catch (err) {
            console.error("Move file failed", err);
            return false;
        }
    };

    const shareFile = async (fileId: string, accountId?: string) => {
        const accId = accountId || activeAccount?.id;
        if (!accId) return null;
        
        try {
            // 1. Set permission to anyone with link can read
            await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                method: "POST",
                headers: { ...headers(accId), "Content-Type": "application/json" },
                body: JSON.stringify({ role: "reader", type: "anyone" }),
            });
            
            // 2. Get the webViewLink
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`, {
                headers: headers(accId),
            });
            const data = await res.json();
            return data.webViewLink;
        } catch (err) {
            console.error("Failed to share file", err);
            return null;
        }
    };

    return (
        <GoogleDriveContext.Provider
            value={{
                accounts, activeAccount, addAccount, switchAccount, removeAccount,
                isLoading, listFiles, uploadFile, deleteFile, createFolder,
                downloadFile, starFile, renameFile, getFileBlob, getStorageQuota, updateMetadata,
                moveFile, shareFile, clearCache,
                chambers, activeChamber, setActiveChamber, createChamber, removeChamber,
            }}
        >
            {children}
        </GoogleDriveContext.Provider>
    );
}

export function useGoogleDrive() {
    const ctx = useContext(GoogleDriveContext);
    if (!ctx) throw new Error("useGoogleDrive must be used within GoogleDriveProvider");
    return ctx;
}

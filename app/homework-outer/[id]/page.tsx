import { use } from "react";
import HomeworkOuterPage from "../page";

export default function PublicUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <HomeworkOuterPage userId={id} />;
}

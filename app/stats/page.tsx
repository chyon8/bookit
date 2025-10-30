'use client';
import StatsView from "../../components/StatsView";
import { useAppContext } from "../../context/AppContext";

export default function StatsPage() {
    const { books, theme } = useAppContext();
    return <StatsView books={books} theme={theme} />;
}

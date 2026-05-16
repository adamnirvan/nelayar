import { router } from '@inertiajs/react';

interface Props {
    dates: string[];
    selectedDate: string;
}

export default function ForecastSlider({ dates, selectedDate }: Props) {
    function handleChange(date: string) {
        router.visit('/map/forecast', { data: { date } });
    }

    return (
        <div>
            <label htmlFor="forecast-date">Tanggal Prakiraan</label>
            <select
                id="forecast-date"
                value={selectedDate}
                onChange={(e) => handleChange(e.target.value)}
            >
                {dates.map((date) => (
                    <option key={date} value={date}>
                        {date}
                    </option>
                ))}
            </select>
        </div>
    );
}

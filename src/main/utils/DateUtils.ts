export function formatTime(date: Date, format: string): string {
    const map: { [key: string]: number } = {
        'Y+': date.getFullYear(),
        'M+': date.getMonth() + 1,
        'D+': date.getDate(),
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
    };

    for (const key in map) {
        if (new RegExp('(' + key + ')').test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? map[key].toString() : ('00' + map[key]).substr(String(map[key]).length));
        }
    }

    return format;
}

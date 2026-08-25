        (function() {
            'use strict';

            // ============================================================
            //  MONTH DATA FOR YEAR 1405
            // ============================================================
            const MONTH_DATA_1405 = {
                1: { days: 31, fridays: 4, officialHolidays: 7, workdays: 20, requiredMinutes: 8800 },
                2: { days: 31, fridays: 4, officialHolidays: 0, workdays: 27, requiredMinutes: 11880 },
                3: { days: 31, fridays: 5, officialHolidays: 2, workdays: 24, requiredMinutes: 10560 },
                4: { days: 31, fridays: 4, officialHolidays: 2, workdays: 25, requiredMinutes: 11000 },
                5: { days: 31, fridays: 5, officialHolidays: 3, workdays: 23, requiredMinutes: 10120 },
                6: { days: 31, fridays: 4, officialHolidays: 1, workdays: 26, requiredMinutes: 11440 },
                7: { days: 30, fridays: 4, officialHolidays: 0, workdays: 26, requiredMinutes: 11440 },
                8: { days: 30, fridays: 5, officialHolidays: 0, workdays: 25, requiredMinutes: 11000 },
                9: { days: 30, fridays: 4, officialHolidays: 0, workdays: 26, requiredMinutes: 11440 },
                10: { days: 30, fridays: 4, officialHolidays: 2, workdays: 24, requiredMinutes: 10560 },
                11: { days: 30, fridays: 5, officialHolidays: 2, workdays: 23, requiredMinutes: 10120 },
                12: { days: 29, fridays: 4, officialHolidays: 4, workdays: 21, requiredMinutes: 9240 },
            };

            // ============================================================
            //  CONSTANTS
            // ============================================================
            const MONTH_NAMES = [
                'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
            ];
            const WEEKDAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
            const REQUIRED_START = 9 * 60;
            const REQUIRED_END = 17 * 60 + 45;
            const REQUIRED_DURATION = REQUIRED_END - REQUIRED_START; // 525 minutes
            const MAX_DAILY_HOURS = 12 * 60;

            // ============================================================
            //  JALALI CALENDAR — ACCURATE CONVERSION
            // ============================================================
            function gregorianToJalali(gy, gm, gd) {
                // Based on algorithm by Kazemi et al.
                const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

                const gy2 = (gm > 2) ? (gy + 1) : gy;
                let days = 355666 + (365 * gy) +
                    Math.floor((gy2 + 3) / 4) -
                    Math.floor((gy2 + 99) / 100) +
                    Math.floor((gy2 + 399) / 400) +
                    gd +
                    gDaysInMonth.slice(0, gm - 1).reduce((a, b) => a + b, 0);
                let jy = -1595 + (33 * Math.floor(days / 12053));
                days %= 12053;
                jy += 4 * Math.floor(days / 1461);
                days %= 1461;
                if (days > 365) {
                    jy += Math.floor((days - 1) / 365);
                    days = (days - 1) % 365;
                }
                const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
                const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
                return [jy, jm, jd];
            }

            function getCurrentJalali() {
                const now = new Date();
                const gy = now.getFullYear();
                const gm = now.getMonth() + 1;
                const gd = now.getDate();
                const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
                return { year: jy, month: jm, day: jd };
            }

            // ============================================================
            //  TIME NORMALIZER
            // ============================================================
            function normalizeTime(input) {
                if (!input || input.trim() === '') return null;
                let str = input.trim().replace(/\s/g, '');

                if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(str)) {
                    return str;
                }
                let match = str.match(/^([0-9]{1,2}):([0-9]{1,2})$/);
                if (match) {
                    let h = parseInt(match[1], 10);
                    let m = parseInt(match[2], 10);
                    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    }
                    return null;
                }
                match = str.match(/^([0-9]{3,4})$/);
                if (match) {
                    let num = parseInt(match[1], 10);
                    if (num >= 0 && num <= 2359) {
                        let h = Math.floor(num / 100);
                        let m = num % 100;
                        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        }
                    }
                    return null;
                }
                match = str.match(/^([0-9]{1,2})$/);
                if (match) {
                    let h = parseInt(match[1], 10);
                    if (h >= 0 && h <= 23) {
                        return `${String(h).padStart(2, '0')}:00`;
                    }
                    return null;
                }
                return null;
            }

            function timeToMinutes(str) {
                if (!str) return null;
                const parts = str.split(':');
                if (parts.length !== 2) return null;
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
                return h * 60 + m;
            }

            function minutesToTime(min) {
                if (min == null || isNaN(min) || min < 0) return '--:--';
                const h = Math.floor(min / 60);
                const m = Math.round(min % 60);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }

            function formatDurationPersian(min) {
                if (min == null || isNaN(min)) return '--:--';
                const sign = min < 0 ? '-' : '';
                const abs = Math.abs(min);
                const h = Math.floor(abs / 60);
                const m = Math.round(abs % 60);
                const hFa = String(h).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                const mFa = String(m).padStart(2, '0').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                return `${sign}${hFa}:${mFa}`;
            }

            function formatDurationWordsPersian(min) {
                if (min == null || isNaN(min)) return '۰ ساعت و ۰ دقیقه';
                const abs = Math.abs(Math.round(min));
                const hours = Math.floor(abs / 60);
                const minutes = abs % 60;
                const toPersianDigits = value => String(value).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه`;
            }

            function formatJalaliDate(year, month, day) {
                const toPersianDigits = value => String(value).replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
                return `${toPersianDigits(year)}/${toPersianDigits(String(month).padStart(2, '0'))}/${toPersianDigits(String(day).padStart(2, '0'))}`;
            }

            function formatMinutesPersian(min) {
                if (min == null || isNaN(min)) return '۰';
                const abs = Math.round(min);
                return String(abs).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
            }

            // ============================================================
            //  STATE
            // ============================================================
            const state = {
                year: 1405,
                month: 1,
                defaultEntry: '09:00',
                defaultExit: '17:45',
                leaveBalance: 0,
                days: {},
                filter: 'all',
            };

            // ============================================================
            //  DOM REFS
            // ============================================================
            const $ = (s) => document.querySelector(s);
            const $$ = (s) => document.querySelectorAll(s);

            const yearSelect = $('#yearSelect');
            const monthSelect = $('#monthSelect');
            const settings = $('#settings');
            const defaultEntryInput = $('#defaultEntry');
            const defaultExitInput = $('#defaultExit');
            const leaveBalanceDaysInput = $('#leaveBalanceDays');
            const leaveBalanceHoursInput = $('#leaveBalanceHours');
            const usedLeaveBalance = $('#usedLeaveBalance');
            const calcBtn = $('#calcBtn');
            const resetBtn = $('#resetBtn');
            const exportBtn = $('#exportBtn');
            const importBtn = $('#importBtn');
            const importFile = $('#importFile');
            const importPreview = $('#importPreview');
            const importPreviewInfo = $('#importPreviewInfo');
            const importPreviewBody = $('#importPreviewBody');
            const confirmImportBtn = $('#confirmImportBtn');
            const cancelImportBtn = $('#cancelImportBtn');
            const tableBody = $('#tableBody');
            const emptyState = $('#emptyState');
            const filterContainer = $('#filterContainer');
            const toast = $('#toast');

            const sumWorkdays = $('#sumWorkdays');
            const sumLeaveDays = $('#sumLeaveDays');
            const sumHourlyLeave = $('#sumHourlyLeave');
            const remainingLeave = $('#remainingLeave');
            const sumFridays = $('#sumFridays');
            const sumOfficialHolidays = $('#sumOfficialHolidays');
            const sumShortage = $('#sumShortage');
            const sumOvertime = $('#sumOvertime');
            const sumNet = $('#sumNet');
            const sumRequired = $('#sumRequired');
            let pendingImportedDays = null;

            // ============================================================
            //  POPULATE SELECTS (default to current month)
            // ============================================================
            function populateSelects() {
                const cur = getCurrentJalali();
                state.year = cur.year;
                let defaultMonth = cur.month;
                if (defaultMonth < 1 || defaultMonth > 12) defaultMonth = 6; // fallback
                state.month = defaultMonth;

                yearSelect.innerHTML = '';
                const opt = document.createElement('option');
                opt.value = cur.year;
                opt.textContent = String(cur.year).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
                opt.selected = true;
                yearSelect.appendChild(opt);

                monthSelect.innerHTML = '';
                MONTH_NAMES.forEach((name, idx) => {
                    const o = document.createElement('option');
                    o.value = idx + 1;
                    o.textContent = name;
                    if (idx + 1 === defaultMonth) o.selected = true;
                    monthSelect.appendChild(o);
                });

                return defaultMonth;
            }

            // ============================================================
            //  STORAGE
            // ============================================================
            function storageKey() {
                return `attendance_${state.year}_${String(state.month).padStart(2, '0')}`;
            }

            function saveToStorage() {
                try {
                    const data = {
                        year: state.year,
                        month: state.month,
                        defaultEntry: state.defaultEntry,
                        defaultExit: state.defaultExit,
                        leaveBalance: state.leaveBalance,
                        days: state.days,
                    };
                    localStorage.setItem(storageKey(), JSON.stringify(data));
                } catch (_) {}
            }

            function loadFromStorage() {
                try {
                    const raw = localStorage.getItem(storageKey());
                    if (!raw) return false;
                    const data = JSON.parse(raw);
                    if (data.year === state.year && data.month === state.month) {
                        if (data.defaultEntry) state.defaultEntry = data.defaultEntry;
                        if (data.defaultExit) state.defaultExit = data.defaultExit;
                        if (data.leaveBalance !== undefined) state.leaveBalance = data.leaveBalance;
                        if (data.days) state.days = data.days;
                        defaultEntryInput.value = state.defaultEntry;
                        defaultExitInput.value = state.defaultExit;
                        setLeaveBalanceInputs(state.leaveBalance);
                        return true;
                    }
                    return false;
                } catch (_) { return false; }
            }

            function setLeaveBalanceInputs(totalMinutes) {
                const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
                leaveBalanceDaysInput.value = Math.floor(safeMinutes / REQUIRED_DURATION);
                leaveBalanceHoursInput.value = Math.floor((safeMinutes % REQUIRED_DURATION) / 60);
            }

            function readLeaveBalanceInputs() {
                const days = Number.parseInt(leaveBalanceDaysInput.value, 10);
                const hours = Number.parseInt(leaveBalanceHoursInput.value, 10);
                if (!Number.isInteger(days) || days < 0 || !Number.isInteger(hours) || hours < 0 || hours > 23) {
                    return null;
                }
                return (days * REQUIRED_DURATION) + (hours * 60);
            }

            // ============================================================
            //  GENERATE MONTH DATA
            // ============================================================
            function generateMonthData() {
                const year = state.year;
                const month = state.month;
                const monthInfo = MONTH_DATA_1405[month];
                if (!monthInfo) return [];

                const daysInMonth = monthInfo.days;
                const result = [];

                for (let d = 1; d <= daysInMonth; d++) {
                    // Compute weekday using known reference: 1400/1/1 = 2021/3/21 was Sunday
                    let offset = 0;
                    for (let y = 1400; y < year; y++) {
                        offset += isJalaliLeap(y) ? 366 : 365;
                    }
                    for (let m = 1; m < month; m++) {
                        offset += jalaliDaysInMonth(year, m);
                    }
                    offset += d - 1;
                    const wd = (1 + offset) % 7; // 0=Sunday, 6=Saturday
                    const isFriday = (wd === 6);
                    const isThursday = (wd === 5);

                    const stored = state.days[String(d)] || {};
                    let entry = stored.entry || null;
                    let exit = stored.exit || null;
                    const manualHoliday = stored.manualHoliday || false;
                    const isLeave = stored.isLeave || false;
                    const fridayWork = stored.fridayWork || false;
                    const leaveStart = stored.leaveStart || null;
                    const leaveEnd = stored.leaveEnd || null;

                    if (manualHoliday || isLeave || (isFriday && !fridayWork)) {
                        entry = null;
                        exit = null;
                    }

                    const isOfficialHoliday = false;
                    const isWorkday = !isFriday && !manualHoliday && !isLeave && !isThursday;

                    if (isWorkday) {
                        if (!entry) entry = state.defaultEntry;
                        if (!exit) exit = state.defaultExit;
                    }

                    result.push({
                        day: d,
                        month: month,
                        year: year,
                        weekday: wd,
                        weekdayName: WEEKDAY_NAMES[wd],
                        entry: entry,
                        exit: exit,
                        isFriday: isFriday,
                        isThursday: isThursday,
                        isOfficialHoliday: isOfficialHoliday,
                        manualHoliday: manualHoliday,
                        isLeave: isLeave,
                        fridayWork: fridayWork,
                        leaveStart: leaveStart,
                        leaveEnd: leaveEnd,
                        leaveStart2: stored.leaveStart2 || null,
                        leaveEnd2: stored.leaveEnd2 || null,
                        leaveStart3: stored.leaveStart3 || null,
                        leaveEnd3: stored.leaveEnd3 || null,
                        isWorkday: isWorkday,
                    });
                }
                return result;
            }

            // Helper functions for Jalali date calculations
            function isJalaliLeap(year) {
                const diff = year - 1400;
                const rem = ((diff % 4) + 4) % 4;
                return rem === 3;
            }

            function jalaliDaysInMonth(year, month) {
                if (month >= 1 && month <= 6) return 31;
                if (month >= 7 && month <= 11) return 30;
                return isJalaliLeap(year) ? 30 : 29;
            }

            // ============================================================
            //  CALCULATE DAY — with leave balance logic
            // ============================================================
            function getHourlyLeaveMinutes(dayData) {
                const ranges = [];
                for (let slot = 1; slot <= 3; slot++) {
                    const start = dayData[`leaveStart${slot}`] || (slot === 1 ? dayData.leaveStart : null);
                    const end = dayData[`leaveEnd${slot}`] || (slot === 1 ? dayData.leaveEnd : null);
                    const startMinutes = timeToMinutes(start);
                    const endMinutes = timeToMinutes(end);
                    if (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes) {
                        ranges.push({ start, end, minutes: endMinutes - startMinutes });
                    }
                }
                return ranges.reduce((total, range) => total + range.minutes, 0);
            }

            function hasDayData(dayData) {
                if (!dayData) return false;
                return ['entry', 'exit', 'manualHoliday', 'isLeave', 'leaveStart', 'leaveEnd',
                    'leaveStart2', 'leaveEnd2', 'leaveStart3', 'leaveEnd3'].some(field => Boolean(dayData[field]));
            }

            function moveToNextInput(input, event, container = tableBody, selector = 'input.time-input:not([disabled])') {
                event.preventDefault();
                const inputs = [...container.querySelectorAll(selector)];
                const currentIndex = inputs.indexOf(input);
                input.blur();
                setTimeout(() => {
                    const refreshedInputs = [...container.querySelectorAll(selector)];
                    const nextIndex = currentIndex + (event.shiftKey ? -1 : 1);
                    const target = refreshedInputs[nextIndex] || (!event.shiftKey && refreshedInputs[0]);
                    if (target) target.focus();
                }, 0);
            }

            function calculateDay(dayData, globalBalance) {
                const {
                    entry,
                    exit,
                    isFriday,
                    isThursday,
                    isOfficialHoliday,
                    manualHoliday,
                    isLeave,
                } = dayData;
                const hourlyLeaveMin = getHourlyLeaveMinutes(dayData);

                if (isOfficialHoliday || manualHoliday) {
                    return {
                        entry: null,
                        exit: null,
                        presentMinutes: null,
                        shortageMinutes: 0,
                        overtimeMinutes: 0,
                        hasData: false,
                        error: null,
                        isLeave: false,
                        isLeaveCovered: false,
                        leaveDuration: 0,
                        leaveShortage: 0,
                        usedLeaveBalance: 0,
                        hourlyLeaveMinutes: 0,
                    };
                }

                // Full day leave
                if (isLeave) {
                    const duration = REQUIRED_DURATION;
                    let shortage = 0;
                    let usedBalance = 0;
                    let covered = false;
                    const bal = globalBalance || 0;
                    if (bal >= duration) {
                        usedBalance = duration;
                        covered = true;
                    } else {
                        usedBalance = bal;
                        shortage = duration - bal;
                        covered = false;
                    }
                    return {
                        entry: null,
                        exit: null,
                        presentMinutes: null,
                        shortageMinutes: shortage,
                        overtimeMinutes: 0,
                        hasData: true,
                        error: null,
                        isLeave: true,
                        isLeaveCovered: covered,
                        leaveDuration: duration,
                        leaveShortage: shortage,
                        usedLeaveBalance: usedBalance,
                        hourlyLeaveMinutes: 0,
                    };
                }

                // Thursday (optional day)
                if (isThursday) {
                    if (!entry || !exit) {
                        if (hourlyLeaveMin > 0) {
                            let shortage = 0;
                            let usedBalance = 0;
                            let covered = false;
                            const bal = globalBalance || 0;
                            if (bal >= hourlyLeaveMin) {
                                usedBalance = hourlyLeaveMin;
                                covered = true;
                            } else {
                                usedBalance = bal;
                                shortage = hourlyLeaveMin - bal;
                                covered = false;
                            }
                            return {
                                entry: null,
                                exit: null,
                                presentMinutes: null,
                                shortageMinutes: shortage,
                                overtimeMinutes: 0,
                                hasData: true,
                                error: null,
                                isLeave: false,
                                isLeaveCovered: covered,
                                leaveDuration: hourlyLeaveMin,
                                leaveShortage: shortage,
                                usedLeaveBalance: usedBalance,
                                hourlyLeaveMinutes: hourlyLeaveMin,
                            };
                        }
                        return {
                            entry: entry || null,
                            exit: exit || null,
                            presentMinutes: null,
                            shortageMinutes: null,
                            overtimeMinutes: null,
                            hasData: false,
                            error: null,
                            isLeave: false,
                            isLeaveCovered: false,
                            leaveDuration: 0,
                            leaveShortage: 0,
                            usedLeaveBalance: 0,
                            hourlyLeaveMinutes: 0,
                        };
                    }
                    const entryMin = timeToMinutes(entry);
                    const exitMin = timeToMinutes(exit);
                    if (entryMin === null || exitMin === null || exitMin <= entryMin) {
                        return {
                            entry: entry,
                            exit: exit,
                            presentMinutes: null,
                            shortageMinutes: null,
                            overtimeMinutes: null,
                            hasData: false,
                            error: 'exit <= entry',
                            isLeave: false,
                            isLeaveCovered: false,
                            leaveDuration: 0,
                            leaveShortage: 0,
                            usedLeaveBalance: 0,
                            hourlyLeaveMinutes: 0,
                        };
                    }
                    const actual = exitMin - entryMin;
                    if (actual > MAX_DAILY_HOURS) {
                        return {
                            entry: entry,
                            exit: exit,
                            presentMinutes: null,
                            shortageMinutes: null,
                            overtimeMinutes: null,
                            hasData: false,
                            error: 'بیش از ۱۲ ساعت',
                            isLeave: false,
                            isLeaveCovered: false,
                            leaveDuration: 0,
                            leaveShortage: 0,
                            usedLeaveBalance: 0,
                            hourlyLeaveMinutes: 0,
                        };
                    }
                    let shortage = Math.max(0, REQUIRED_DURATION - actual);
                    let overtime = Math.max(0, actual - REQUIRED_DURATION);
                    let usedLeave = 0;
                    let leaveShortage = 0;
                    let covered = false;
                    if (hourlyLeaveMin > 0) {
                        const bal = globalBalance || 0;
                        if (bal >= hourlyLeaveMin) {
                            usedLeave = hourlyLeaveMin;
                            covered = true;
                        } else {
                            usedLeave = bal;
                            leaveShortage = hourlyLeaveMin - bal;
                            covered = false;
                        }
                        shortage = Math.max(0, shortage - usedLeave);
                    }
                    return {
                        entry: entry,
                        exit: exit,
                        presentMinutes: actual,
                        shortageMinutes: shortage,
                        overtimeMinutes: overtime,
                        hasData: true,
                        error: null,
                        isLeave: false,
                        isLeaveCovered: covered,
                        leaveDuration: hourlyLeaveMin,
                        leaveShortage: leaveShortage,
                        usedLeaveBalance: usedLeave,
                        hourlyLeaveMinutes: hourlyLeaveMin,
                    };
                }

                // Normal workday
                if (!entry || !exit) {
                    if (hourlyLeaveMin > 0) {
                        let shortage = 0;
                        let usedBalance = 0;
                        let covered = false;
                        const bal = globalBalance || 0;
                        if (bal >= hourlyLeaveMin) {
                            usedBalance = hourlyLeaveMin;
                            covered = true;
                        } else {
                            usedBalance = bal;
                            shortage = hourlyLeaveMin - bal;
                            covered = false;
                        }
                        return {
                            entry: null,
                            exit: null,
                            presentMinutes: null,
                            shortageMinutes: shortage,
                            overtimeMinutes: 0,
                            hasData: true,
                            error: null,
                            isLeave: false,
                            isLeaveCovered: covered,
                            leaveDuration: hourlyLeaveMin,
                            leaveShortage: shortage,
                            usedLeaveBalance: usedBalance,
                            hourlyLeaveMinutes: hourlyLeaveMin,
                        };
                    }
                    return {
                        entry: entry || null,
                        exit: exit || null,
                        presentMinutes: null,
                        shortageMinutes: null,
                        overtimeMinutes: null,
                        hasData: false,
                        error: null,
                        isLeave: false,
                        isLeaveCovered: false,
                        leaveDuration: 0,
                        leaveShortage: 0,
                        usedLeaveBalance: 0,
                        hourlyLeaveMinutes: 0,
                    };
                }
                const entryMin = timeToMinutes(entry);
                const exitMin = timeToMinutes(exit);
                if (entryMin === null || exitMin === null || exitMin <= entryMin) {
                    return {
                        entry: entry,
                        exit: exit,
                        presentMinutes: null,
                        shortageMinutes: null,
                        overtimeMinutes: null,
                        hasData: false,
                        error: 'exit <= entry',
                        isLeave: false,
                        isLeaveCovered: false,
                        leaveDuration: 0,
                        leaveShortage: 0,
                        usedLeaveBalance: 0,
                        hourlyLeaveMinutes: 0,
                    };
                }
                const actual = exitMin - entryMin;
                if (isFriday && dayData.fridayWork) {
                    return {
                        entry: entry,
                        exit: exit,
                        presentMinutes: actual,
                        shortageMinutes: 0,
                        overtimeMinutes: actual,
                        hasData: true,
                        error: null,
                        isLeave: false,
                        isLeaveCovered: false,
                        leaveDuration: 0,
                        leaveShortage: 0,
                        usedLeaveBalance: 0,
                        hourlyLeaveMinutes: 0,
                    };
                }
                if (actual > MAX_DAILY_HOURS) {
                    return {
                        entry: entry,
                        exit: exit,
                        presentMinutes: null,
                        shortageMinutes: null,
                        overtimeMinutes: null,
                        hasData: false,
                        error: 'بیش از ۱۲ ساعت',
                        isLeave: false,
                        isLeaveCovered: false,
                        leaveDuration: 0,
                        leaveShortage: 0,
                        usedLeaveBalance: 0,
                        hourlyLeaveMinutes: 0,
                    };
                }
                let shortage = Math.max(0, REQUIRED_DURATION - actual);
                let overtime = Math.max(0, actual - REQUIRED_DURATION);
                let usedLeave = 0;
                let leaveShortage = 0;
                let covered = false;
                if (hourlyLeaveMin > 0) {
                    const bal = globalBalance || 0;
                    if (bal >= hourlyLeaveMin) {
                        usedLeave = hourlyLeaveMin;
                        covered = true;
                    } else {
                        usedLeave = bal;
                        leaveShortage = hourlyLeaveMin - bal;
                        covered = false;
                    }
                    shortage = Math.max(0, shortage - usedLeave);
                }
                return {
                    entry: entry,
                    exit: exit,
                    presentMinutes: actual,
                    shortageMinutes: shortage,
                    overtimeMinutes: overtime,
                    hasData: true,
                    error: null,
                    isLeave: false,
                    isLeaveCovered: covered,
                    leaveDuration: hourlyLeaveMin,
                    leaveShortage: leaveShortage,
                    usedLeaveBalance: usedLeave,
                    hourlyLeaveMinutes: hourlyLeaveMin,
                };
            }

            // ============================================================
            //  HANDLE TIME INPUT
            // ============================================================
            function handleTimeInput(input, field, day) {
                const val = input.value.trim();
                if (!val) {
                    if (day) {
                        if (!state.days[day]) {
                            state.days[day] = { entry: null, exit: null, manualHoliday: false, isLeave: false,
                                leaveStart: null, leaveEnd: null };
                        }
                        state.days[day][field] = null;
                    }
                    return null;
                }

                const normalized = normalizeTime(val);
                if (normalized) {
                    if (day && (field === 'entry' || field === 'exit')) {
                        const current = state.days[day] || generateMonthData().find(item => String(item.day) === String(day)) || {};
                        const entry = field === 'entry' ? normalized : current.entry;
                        const exit = field === 'exit' ? normalized : current.exit;
                        const entryMinutes = timeToMinutes(entry);
                        const exitMinutes = timeToMinutes(exit);
                        if (entryMinutes !== null && exitMinutes !== null && exitMinutes <= entryMinutes) {
                            input.value = '';
                            showToast('ساعت خروج باید بعد از ساعت ورود باشد');
                            return null;
                        }
                    }
                    input.value = normalized;
                    if (day) {
                        if (!state.days[day]) {
                            state.days[day] = { entry: null, exit: null, manualHoliday: false, isLeave: false,
                                leaveStart: null, leaveEnd: null };
                        }
                        state.days[day][field] = normalized;
                    }
                    return normalized;
                } else {
                    input.value = '';
                    input.classList.add('error');
                    showToast('لطفاً زمان را به صورت صحیح وارد کنید (مثلاً 9 یا 09:00 یا 900)');
                    setTimeout(() => input.classList.remove('error'), 3000);
                    if (day) {
                        if (!state.days[day]) {
                            state.days[day] = { entry: null, exit: null, manualHoliday: false, isLeave: false,
                                leaveStart: null, leaveEnd: null };
                        }
                        state.days[day][field] = null;
                    }
                    return null;
                }
            }

            // ============================================================
            //  RENDER TABLE
            // ============================================================
            function renderTable() {
                const monthData = generateMonthData();
                const filter = state.filter;

                // Compute all day results with current balance
                const dayResults = {};
                for (const day of monthData) {
                    dayResults[day.day] = calculateDay(day, state.leaveBalance);
                }

                let html = '';

                for (const day of monthData) {
                    const calc = dayResults[day.day] || calculateDay(day, state.leaveBalance);

                    let include = true;
                    if (filter === 'workday') {
                        include = day.isWorkday || day.isThursday || day.isFriday;
                    } else if (filter === 'shortage') {
                        include = calc.hasData && calc.shortageMinutes !== null && calc.shortageMinutes > 0;
                    } else if (filter === 'overtime') {
                        include = calc.hasData && calc.overtimeMinutes !== null && calc.overtimeMinutes > 0;
                    } else if (filter === 'leave') {
                        include = day.isLeave === true;
                    } else if (filter === 'hourlyleave') {
                        include = (calc.hourlyLeaveMinutes || 0) > 0;
                    }
                    if (!include) continue;

                    const dayStr = String(day.day);
                    const isFriday = day.isFriday;
                    const isThursday = day.isThursday;
                    const isOfficialHoliday = day.isOfficialHoliday;
                    const manualHoliday = day.manualHoliday;
                    const isLeave = day.isLeave;
                    const isWorkday = day.isWorkday;
                    const fridayWork = day.fridayWork === true;

                    let rowClass = '';
                    let statusBadge = '';
                    let statusText = '';

                    const leaveCovered = calc.isLeaveCovered;
                    const hasLeave = (isLeave || calc.leaveDuration > 0);

                    if (isOfficialHoliday) {
                        rowClass = 'manual-holiday';
                        statusBadge = 'badge-manual-holiday';
                        statusText = 'تعطیل رسمی';
                    } else if (manualHoliday) {
                        rowClass = 'manual-holiday';
                        statusBadge = 'badge-manual-holiday';
                        statusText = 'تعطیل دستی';
                    } else if (isLeave) {
                        if (leaveCovered) {
                            rowClass = 'leave-covered';
                            statusBadge = 'badge-leave-covered';
                            statusText = 'مرخصی ✅';
                        } else {
                            rowClass = 'leave-shortage';
                            statusBadge = 'badge-leave-shortage';
                            statusText = 'مرخصی ❌';
                        }
                    } else if (isFriday) {
                        rowClass = 'friday-row';
                        statusBadge = 'badge-friday';
                        statusText = 'جمعه';
                    } else if (isThursday) {
                        rowClass = 'thursday-row';
                        statusBadge = 'badge-thursday';
                        statusText = 'اختیاری';
                    } else if (isWorkday) {
                        statusBadge = 'badge-workday';
                        statusText = 'کاری';
                    }

                    // Hourly leave override
                    if (!isLeave && calc.leaveDuration > 0 && !isFriday && !manualHoliday && !isOfficialHoliday) {
                        if (leaveCovered) {
                            statusBadge = 'badge-leave-covered';
                            statusText = 'مرخصی ساعتی ✅';
                            rowClass = 'leave-covered';
                        } else {
                            statusBadge = 'badge-leave-shortage';
                            statusText = 'مرخصی ساعتی ❌';
                            rowClass = 'leave-shortage';
                        }
                    }

                    const entryVal = calc.entry || '';
                    const exitVal = calc.exit || '';
                    const disabled = (manualHoliday || isLeave || isOfficialHoliday || (isFriday && !fridayWork)) ? 'disabled' : '';
                    const isCheckboxDisabled = isOfficialHoliday ? 'disabled' : '';
                    const holidayChecked = (manualHoliday && !isFriday && !isOfficialHoliday) ? 'checked' : '';
                    const leaveChecked = (isLeave && !isFriday && !isOfficialHoliday) ? 'checked' : '';

                    const leaveDisabled = (isFriday || manualHoliday || isLeave || isOfficialHoliday) ? 'disabled' : '';
                    const leaveUsedStr = calc.leaveDuration > 0 ? formatDurationWordsPersian(calc.leaveDuration) : '—';
                    const leaveInputsHtml = [1, 2, 3].map(slot => {
                        const startField = slot === 1 ? 'leaveStart' : `leaveStart${slot}`;
                        const endField = slot === 1 ? 'leaveEnd' : `leaveEnd${slot}`;
                        const startVal = day[startField] || '';
                        const endVal = day[endField] || '';
                        const clearButton = startVal && endVal
                            ? `<button type="button" class="clear-leave-btn" data-day="${dayStr}" data-slot="${slot}" title="حذف مرخصی ساعتی" aria-label="حذف مرخصی ساعتی">×</button>`
                            : '';
                        return `<td><input type="text" class="time-input leave-input" value="${startVal}" data-day="${dayStr}" data-field="${startField}" ${leaveDisabled} maxlength="5" placeholder="--:--" /></td><td class="leave-end-cell"><input type="text" class="time-input leave-input" value="${endVal}" data-day="${dayStr}" data-field="${endField}" ${leaveDisabled} maxlength="5" placeholder="--:--" />${clearButton}</td>`;
                    }).join('');

                    let presentStr = '—';
                    let shortageStr = '—';
                    let overtimeStr = '—';
                    let shortageClass = 'cell-dash';
                    let overtimeClass = 'cell-dash';
                    let presentClass = 'cell-dash';

                    if (calc.hasData && calc.presentMinutes !== null) {
                        presentStr = minutesToTime(calc.presentMinutes);
                        presentClass = 'cell-value';
                    }
                    if (calc.hasData && calc.shortageMinutes !== null && calc.shortageMinutes > 0) {
                        shortageStr = formatDurationPersian(calc.shortageMinutes);
                        shortageClass = 'cell-value cell-shortage';
                    } else if (calc.hasData && calc.shortageMinutes !== null && calc.shortageMinutes === 0) {
                        shortageStr = '۰۰:۰۰';
                        shortageClass = 'cell-value cell-neutral';
                    }
                    if (calc.hasData && calc.overtimeMinutes !== null && calc.overtimeMinutes > 0) {
                        overtimeStr = formatDurationPersian(calc.overtimeMinutes);
                        overtimeClass = 'cell-value cell-overtime';
                    } else if (calc.hasData && calc.overtimeMinutes !== null && calc.overtimeMinutes === 0) {
                        overtimeStr = '۰۰:۰۰';
                        overtimeClass = 'cell-value cell-neutral';
                    }

                    if ((isFriday && !fridayWork) || manualHoliday || isOfficialHoliday) {
                        shortageStr = '۰';
                        overtimeStr = '۰';
                        shortageClass = 'cell-value cell-neutral';
                        overtimeClass = 'cell-value cell-neutral';
                        presentStr = '—';
                        presentClass = 'cell-dash';
                    }
                    if (isLeave) {
                        shortageStr = '۰';
                        overtimeStr = '۰';
                        shortageClass = 'cell-value cell-neutral';
                        overtimeClass = 'cell-value cell-neutral';
                        presentStr = '—';
                        presentClass = 'cell-dash';
                    }

                    let errorMsg = '';
                    if (calc.error) {
                        errorMsg = `<div class="error-msg">${calc.error}</div>`;
                    }

                    let dotHtml = '';
                    if (hasLeave) {
                        if (leaveCovered) {
                            dotHtml = `<span class="leave-status-dot green" title="پوشش داده شده با مرخصی"></span>`;
                        } else {
                            dotHtml = `<span class="leave-status-dot red" title="کسرکار"></span>`;
                        }
                    }

                    html += `<tr class="${rowClass}" data-day="${dayStr}">`;
                    html += `<td>${day.weekdayName}</td>`;
                    html += `<td>${formatJalaliDate(day.year, day.month, day.day)}</td>`;
                    html += `<td><span class="badge ${statusBadge}">${statusText} ${dotHtml}</span></td>`;
                    const fridayCheck = isFriday ? (fridayWork ? 'checked' : '') : holidayChecked;
                    html +=
                        `<td><input type="checkbox" class="holiday-check" data-day="${dayStr}" ${fridayCheck} ${isCheckboxDisabled} /></td>`;
                    html +=
                        `${isFriday ? '<td>—</td>' : `<td><input type="checkbox" class="leave-check" data-day="${dayStr}" ${leaveChecked} ${isCheckboxDisabled} /></td>`}`;
                    html +=
                        `<td><input type="text" class="time-input" value="${entryVal}" data-day="${dayStr}" data-field="entry" ${disabled} maxlength="5" placeholder="--:--" /></td>`;
                    html +=
                        `<td><input type="text" class="time-input" value="${exitVal}" data-day="${dayStr}" data-field="exit" ${disabled} maxlength="5" placeholder="--:--" /></td>`;
                    html += `<td class="${presentClass}">${presentStr}</td>`;
                    html += `<td class="${shortageClass}">${shortageStr}</td>`;
                    html += `<td class="${overtimeClass}">${overtimeStr}</td>`;
                    html += leaveInputsHtml;
                    html += `<td class="leave-used-cell ${calc.leaveDuration > 0 ? 'cell-value cell-neutral' : 'cell-dash'}">${leaveUsedStr}</td>`;
                    html += `</tr>`;
                }

                tableBody.innerHTML = html;
                emptyState.hidden = html !== '';

                // --- Event listeners ---

                // Time inputs (entry/exit)
                tableBody.querySelectorAll('.time-input:not(.leave-input):not([disabled])').forEach(inp => {
                    inp.addEventListener('blur', function(e) {
                        const day = this.dataset.day;
                        const field = this.dataset.field;
                        const normalized = handleTimeInput(this, field, day);
                        if (normalized !== null) {
                            const entry = state.days[day]?.entry;
                            const exit = state.days[day]?.exit;
                            const manual = state.days[day]?.manualHoliday;
                            const leave = state.days[day]?.isLeave;
                            const ls = state.days[day]?.leaveStart;
                            const le = state.days[day]?.leaveEnd;
                            if (!hasDayData(state.days[day])) {
                                delete state.days[day];
                            }
                            saveToStorage();
                            renderTable();
                            applyFilter(state.filter);
                        }
                    });
                    inp.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === 'Tab') moveToNextInput(this, e);
                    });
                });

                // Leave start/end inputs
                tableBody.querySelectorAll('.leave-input:not([disabled])').forEach(inp => {
                    inp.addEventListener('blur', function(e) {
                        const day = this.dataset.day;
                        const field = this.dataset.field;
                        const normalized = handleTimeInput(this, field, day);
                        if (normalized !== null) {
                            // Validate each leave range independently.
                            for (let slot = 1; slot <= 3; slot++) {
                                const startField = slot === 1 ? 'leaveStart' : `leaveStart${slot}`;
                                const endField = slot === 1 ? 'leaveEnd' : `leaveEnd${slot}`;
                                const start = state.days[day]?.[startField];
                                const end = state.days[day]?.[endField];
                                if (start && end) {
                                    const startMinutes = timeToMinutes(start);
                                    const endMinutes = timeToMinutes(end);
                                    if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
                                        showToast('زمان پایان مرخصی باید بعد از شروع باشد');
                                        this.value = '';
                                        state.days[day][field] = null;
                                        saveToStorage();
                                        renderTable();
                                        applyFilter(state.filter);
                                        return;
                                    }
                                    const requiredStartMinutes = timeToMinutes(state.defaultEntry);
                                    const requiredEndMinutes = timeToMinutes(state.defaultExit);
                                    if (requiredStartMinutes !== null && requiredEndMinutes !== null &&
                                        (startMinutes < requiredStartMinutes || endMinutes > requiredEndMinutes)) {
                                        showToast(`مرخصی باید بین ${state.defaultEntry} تا ${state.defaultExit} باشد`);
                                        this.value = '';
                                        state.days[day][field] = null;
                                        saveToStorage();
                                        renderTable();
                                        applyFilter(state.filter);
                                        return;
                                    }
                                }
                            }
                            // If leave has duration, uncheck full-day leave
                            if (getHourlyLeaveMinutes(state.days[day]) > 0 && state.days[day]?.isLeave) {
                                state.days[day].isLeave = false;
                                const chk = document.querySelector(`.leave-check[data-day="${day}"]`);
                                if (chk) chk.checked = false;
                            }
                            saveToStorage();
                            renderTable();
                            applyFilter(state.filter);
                        }
                    });
                    inp.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === 'Tab') moveToNextInput(this, e);
                    });
                });

                tableBody.querySelectorAll('.clear-leave-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const day = this.dataset.day;
                        if (state.days[day]) {
                            const slot = this.dataset.slot;
                            const startField = slot === '1' ? 'leaveStart' : `leaveStart${slot}`;
                            const endField = slot === '1' ? 'leaveEnd' : `leaveEnd${slot}`;
                            state.days[day][startField] = null;
                            state.days[day][endField] = null;
                            if (!hasDayData(state.days[day])) {
                                delete state.days[day];
                            }
                        }
                        saveToStorage();
                        renderTable();
                        applyFilter(state.filter);
                    });
                });

                // Holiday checkbox
                tableBody.querySelectorAll('.holiday-check:not([disabled])').forEach(chk => {
                    chk.addEventListener('change', function(e) {
                        const day = this.dataset.day;
                        const checked = this.checked;
                        const dayData = generateMonthData().find(item => String(item.day) === day);
                        if (dayData?.isFriday) {
                            if (!state.days[day]) state.days[day] = { entry: null, exit: null, manualHoliday: false, isLeave: false, leaveStart: null, leaveEnd: null };
                            state.days[day].fridayWork = checked;
                            state.days[day].entry = null;
                            state.days[day].exit = null;
                            saveToStorage();
                            renderTable();
                            applyFilter(state.filter);
                            return;
                        }
                        if (checked) {
                            const leaveChk = document.querySelector(`.leave-check[data-day="${day}"]`);
                            if (leaveChk) leaveChk.checked = false;
                            if (!state.days[day]) {
                                state.days[day] = { entry: null, exit: null, manualHoliday: false,
                                    isLeave: false, leaveStart: null, leaveEnd: null };
                            }
                            state.days[day].manualHoliday = true;
                            state.days[day].isLeave = false;
                            state.days[day].entry = null;
                            state.days[day].exit = null;
                            for (let slot = 1; slot <= 3; slot++) {
                                const startField = slot === 1 ? 'leaveStart' : `leaveStart${slot}`;
                                const endField = slot === 1 ? 'leaveEnd' : `leaveEnd${slot}`;
                                state.days[day][startField] = null;
                                state.days[day][endField] = null;
                            }
                        } else {
                            if (state.days[day]) {
                                state.days[day].manualHoliday = false;
                                if (!hasDayData(state.days[day])) {
                                    delete state.days[day];
                                }
                            }
                        }
                        saveToStorage();
                        renderTable();
                        applyFilter(state.filter);
                    });
                });

                // Leave checkbox (full day)
                tableBody.querySelectorAll('.leave-check:not([disabled])').forEach(chk => {
                    chk.addEventListener('change', function(e) {
                        const day = this.dataset.day;
                        const checked = this.checked;
                        if (checked) {
                            const holidayChk = document.querySelector(`.holiday-check[data-day="${day}"]`);
                            if (holidayChk) holidayChk.checked = false;
                            if (!state.days[day]) {
                                state.days[day] = { entry: null, exit: null, manualHoliday: false,
                                    isLeave: false, leaveStart: null, leaveEnd: null };
                            }
                            state.days[day].isLeave = true;
                            state.days[day].manualHoliday = false;
                            state.days[day].entry = null;
                            state.days[day].exit = null;
                            for (let slot = 1; slot <= 3; slot++) {
                                const startField = slot === 1 ? 'leaveStart' : `leaveStart${slot}`;
                                const endField = slot === 1 ? 'leaveEnd' : `leaveEnd${slot}`;
                                state.days[day][startField] = null;
                                state.days[day][endField] = null;
                            }
                        } else {
                            if (state.days[day]) {
                                state.days[day].isLeave = false;
                                if (!hasDayData(state.days[day])) {
                                    delete state.days[day];
                                }
                            }
                        }
                        saveToStorage();
                        renderTable();
                        applyFilter(state.filter);
                    });
                });

                updateSummary(monthData);
            }

            // ============================================================
            //  UPDATE SUMMARY
            // ============================================================
            function updateSummary(monthData) {
                const month = state.month;
                const monthInfo = MONTH_DATA_1405[month];
                if (!monthInfo) return;

                let workdayCount = 0;
                let leaveDayCount = 0;
                let totalShortage = 0;
                let totalOvertime = 0;
                let totalHourlyLeave = 0;
                let totalUsedLeave = 0;
                let totalLeaveDuration = 0;

                const dayResults = {};
                let totalLeaveUsedFromBalance = 0;
                for (const day of monthData) {
                    const calc = calculateDay(day, state.leaveBalance);
                    dayResults[day.day] = calc;
                    if (calc.isLeave || calc.leaveDuration > 0) {
                        totalLeaveUsedFromBalance += calc.usedLeaveBalance || 0;
                        totalLeaveDuration += calc.leaveDuration || 0;
                    }
                }

                for (const day of monthData) {
                    const calc = dayResults[day.day] || calculateDay(day, state.leaveBalance);
                    if (day.manualHoliday || day.isOfficialHoliday) continue;
                    if (day.isLeave) {
                        leaveDayCount++;
                        continue;
                    }
                    if (day.isThursday && !calc.hasData) continue;
                    if (!calc.hasData) continue;
                    if (!day.isFriday) workdayCount++;
                    if (calc.shortageMinutes !== null) totalShortage += calc.shortageMinutes;
                    if (calc.overtimeMinutes !== null) totalOvertime += calc.overtimeMinutes;
                    if (calc.hourlyLeaveMinutes) totalHourlyLeave += calc.hourlyLeaveMinutes;
                    if (calc.usedLeaveBalance) totalUsedLeave += calc.usedLeaveBalance;
                }

                let remainingBalance = Math.max(0, state.leaveBalance - totalLeaveUsedFromBalance);
                let totalShortageAdjusted = totalShortage;
                for (const day of monthData) {
                    const calc = dayResults[day.day] || calculateDay(day, state.leaveBalance);
                    if (calc.leaveShortage > 0) {
                        totalShortageAdjusted += calc.leaveShortage;
                    }
                }

                const net = totalOvertime - totalShortageAdjusted;

                sumWorkdays.textContent = workdayCount;
                sumLeaveDays.textContent = leaveDayCount;
                sumHourlyLeave.textContent = formatDurationWordsPersian(totalHourlyLeave);
                remainingLeave.textContent = formatDurationWordsPersian(remainingBalance);
                usedLeaveBalance.textContent = `میزان مرخصی استفاده‌شده: ${formatDurationWordsPersian(totalLeaveUsedFromBalance)}`;
                sumFridays.textContent = monthInfo.fridays;
                sumOfficialHolidays.textContent = '۰';
                sumShortage.textContent = formatDurationWordsPersian(totalShortageAdjusted);
                sumOvertime.textContent = formatDurationWordsPersian(totalOvertime);

                const netEl = sumNet;
                netEl.textContent = formatDurationWordsPersian(net);
                netEl.className = 'value';
                if (net > 0) netEl.classList.add('positive');
                else if (net < 0) netEl.classList.add('negative');
                else netEl.classList.add('neutral');

                sumRequired.textContent = formatDurationWordsPersian(monthInfo.requiredMinutes);
            }

            // ============================================================
            //  FILTERS
            // ============================================================
            function applyFilter(filter) {
                state.filter = filter;
                filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filter === filter);
                });
                renderTable();
            }

            // ============================================================
            //  TOAST
            // ============================================================
            let toastTimeout = null;

            function showToast(msg) {
                toast.textContent = msg;
                toast.classList.add('show');
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }

            // ============================================================
            //  RESET
            // ============================================================
            function resetMonth() {
                const overlay = document.createElement('div');
                overlay.className = 'confirm-overlay';
                overlay.innerHTML = `
                    <div class="confirm-box">
                        <p>آیا مطمئن هستید اطلاعات این ماه پاک شود؟</p>
                        <div class="btn-group">
                            <button class="btn btn-confirm-danger" id="confirmResetYes">بله، پاک کن</button>
                            <button class="btn btn-confirm-cancel" id="confirmResetNo">انصراف</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);

                const yesBtn = overlay.querySelector('#confirmResetYes');
                const noBtn = overlay.querySelector('#confirmResetNo');

                const cleanup = () => { if (overlay.parentNode) overlay.remove(); };

                yesBtn.addEventListener('click', () => {
                    state.days = {};
                    saveToStorage();
                    renderTable();
                    applyFilter(state.filter);
                    cleanup();
                    showToast('اطلاعات ماه با موفقیت پاک شد');
                });

                noBtn.addEventListener('click', cleanup);
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) cleanup();
                });
            }

            // ============================================================
            //  EXPORT
            // ============================================================
            function exportFile() {
                try {
                    const monthData = generateMonthData();
                    const monthName = MONTH_NAMES[state.month - 1];
                    const fileName = `حضور_و_غیاب_${monthName}_${state.year}.csv`;

                    let rows = [];
                    rows.push(['روز', 'تاریخ', 'وضعیت', 'ورود', 'خروج', 'حضور', 'کسرکار', 'اضافه‌کار', 'مرخصی از ۱', 'مرخصی تا ۱', 'مرخصی از ۲', 'مرخصی تا ۲', 'مرخصی از ۳', 'مرخصی تا ۳', 'مرخصی استفاده‌شده']
                        .join(','));

                    for (const day of monthData) {
                        const calc = calculateDay(day, state.leaveBalance);
                        let status = '';
                        if (day.isOfficialHoliday) status = 'تعطیل رسمی';
                        else if (day.manualHoliday) status = 'تعطیل دستی';
                        else if (day.isLeave) {
                            status = calc.isLeaveCovered ? 'مرخصی (پوشش)' : 'مرخصی (کسرکار)';
                        } else if (day.isFriday) status = 'جمعه';
                        else if (day.isThursday) status = 'اختیاری';
                        else if (day.isWorkday) status = 'کاری';

                        let entry = calc.entry || '';
                        let exit = calc.exit || '';
                        let present = '—';
                        let shortage = '—';
                        let overtime = '—';

                        if (calc.hasData && calc.presentMinutes !== null) {
                            present = minutesToTime(calc.presentMinutes);
                        }
                        if (calc.hasData && calc.shortageMinutes !== null) {
                            shortage = formatDurationPersian(calc.shortageMinutes);
                        }
                        if (calc.hasData && calc.overtimeMinutes !== null) {
                            overtime = formatDurationPersian(calc.overtimeMinutes);
                        }

                        if (day.isFriday || day.manualHoliday || day.isOfficialHoliday) {
                            shortage = '۰';
                            overtime = '۰';
                            present = '—';
                        }
                        if (day.isLeave) {
                            shortage = '۰';
                            overtime = '۰';
                            present = '—';
                        }

                        rows.push([
                            day.day,
                            day.weekdayName,
                            formatJalaliDate(day.year, day.month, day.day),
                            status,
                            entry,
                            exit,
                            present,
                            shortage,
                            overtime,
                            day.leaveStart || '',
                            day.leaveEnd || '',
                            day.leaveStart2 || '',
                            day.leaveEnd2 || '',
                            day.leaveStart3 || '',
                            day.leaveEnd3 || '',
                            calc.leaveDuration > 0 ? formatDurationPersian(calc.leaveDuration) : '—'
                        ].join(','));
                    }

                    rows.push('');
                    rows.push('خلاصه ماه,');
                    rows.push(`روزهای کاری ثبت‌شده,${sumWorkdays.textContent}`);
                    rows.push(`روزهای مرخصی,${sumLeaveDays.textContent}`);
                    rows.push(`مرخصی ساعتی,${sumHourlyLeave.textContent}`);
                    rows.push(`موجودی مرخصی,${remainingLeave.textContent}`);
                    rows.push(`جمعه‌ها,${sumFridays.textContent}`);
                    rows.push(`تعطیلات رسمی,${sumOfficialHolidays.textContent}`);
                    rows.push(`مجموع کسرکار,${sumShortage.textContent}`);
                    rows.push(`مجموع اضافه‌کار,${sumOvertime.textContent}`);
                    rows.push(`خالص,${sumNet.textContent}`);
                    rows.push(`ساعات موظفی ماه,${sumRequired.textContent}`);

                    const csvContent = rows.join('\n');
                    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 5000);

                    showToast('فایل خروجی با موفقیت دانلود شد');
                } catch (err) {
                    showToast('خطا در ایجاد فایل خروجی: ' + err.message);
                }
            }

            function importFileData(file) {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const text = String(reader.result || '').replace(/^\uFEFF/, '');
                        const rows = text.split(/\r?\n/).map(line => line.split(','));
                        const header = rows[0] || [];
                        const isCurrentFormat = header[0] === 'روز' && header[1] === 'تاریخ' && header[8] === 'مرخصی از ۱';
                        const isPreviousFormat = header[0] === 'تاریخ' && header[1] === 'روز' && header[8] === 'مرخصی از ۱';
                        if (!isCurrentFormat && !isPreviousFormat) {
                            throw new Error('این فایل با خروجی همین برنامه سازگار نیست');
                        }
                        const dayColumn = isCurrentFormat ? 0 : 1;

                        const importedDays = {};
                        for (const row of rows.slice(1)) {
                            const day = Number.parseInt(row[dayColumn], 10);
                            if (!Number.isInteger(day) || day < 1 || day > 31 || row[0] === 'خلاصه ماه') break;

                            const status = row[2] || '';
                            const entry = normalizeTime(row[3]);
                            const exit = normalizeTime(row[4]);
                            const leaveStart = normalizeTime(row[8]);
                            const leaveEnd = normalizeTime(row[9]);
                            const leaveStart2 = normalizeTime(row[10]);
                            const leaveEnd2 = normalizeTime(row[11]);
                            const leaveStart3 = normalizeTime(row[12]);
                            const leaveEnd3 = normalizeTime(row[13]);
                            const manualHoliday = status === 'تعطیل دستی';
                            const isLeave = status.indexOf('مرخصی (') === 0;

                            const data = {
                                entry,
                                exit,
                                manualHoliday,
                                isLeave,
                                leaveStart,
                                leaveEnd,
                                leaveStart2,
                                leaveEnd2,
                                leaveStart3,
                                leaveEnd3,
                            };
                            if (hasDayData(data)) importedDays[String(day)] = data;
                        }

                        showImportPreview(importedDays, file.name);
                    } catch (error) {
                        showToast('خطا در ورود فایل: ' + error.message);
                    } finally {
                        importFile.value = '';
                    }
                };
                reader.onerror = () => showToast('خواندن فایل امکان‌پذیر نیست');
                reader.readAsText(file, 'UTF-8');
            }

            function showImportPreview(importedDays, fileName) {
                pendingImportedDays = importedDays;
                const days = Object.keys(importedDays).sort((a, b) => Number(a) - Number(b));
                importPreviewInfo.textContent = `${fileName} | ${days.length} روز دارای اطلاعات | ماه انتخاب‌شده: ${MONTH_NAMES[state.month - 1]}`;
                importPreviewBody.innerHTML = days.map(day => {
                    const data = importedDays[day];
                    const date = `${state.year}/${String(state.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
                        .replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
                    const leave = slot => {
                        const start = slot === 1 ? data.leaveStart : data[`leaveStart${slot}`];
                        const end = slot === 1 ? data.leaveEnd : data[`leaveEnd${slot}`];
                        return start && end ? `${start} تا ${end}` : '—';
                    };
                    return `<tr><td>${date}</td><td>${day}</td><td>${data.entry || '—'}</td><td>${data.exit || '—'}</td><td>${leave(1)}</td><td>${leave(2)}</td><td>${leave(3)}</td></tr>`;
                }).join('') || '<tr><td colspan="7">اطلاعات روزانه‌ای در فایل پیدا نشد</td></tr>';
                importPreview.hidden = false;
            }

            function closeImportPreview() {
                importPreview.hidden = true;
                pendingImportedDays = null;
            }

            // ============================================================
            //  MONTH CHANGE
            // ============================================================
            function onMonthChange() {
                const newMonth = parseInt(monthSelect.value, 10);

                const entryNorm = normalizeTime(defaultEntryInput.value);
                const exitNorm = normalizeTime(defaultExitInput.value);

                if (!entryNorm) {
                    defaultEntryInput.value = '09:00';
                    showToast('ورود پیش‌فرض تصحیح شد');
                } else {
                    defaultEntryInput.value = entryNorm;
                }

                if (!exitNorm) {
                    defaultExitInput.value = '17:45';
                    showToast('خروج پیش‌فرض تصحیح شد');
                } else {
                    defaultExitInput.value = exitNorm;
                }

                state.month = newMonth;
                state.defaultEntry = defaultEntryInput.value;
                state.defaultExit = defaultExitInput.value;
                const balance = readLeaveBalanceInputs();
                state.leaveBalance = balance === null ? 0 : balance;

                const loaded = loadFromStorage();
                if (!loaded) {
                    state.days = {};
                }

                renderTable();
                applyFilter(state.filter);
            }

            // ============================================================
            //  UPDATE DEFAULTS & LEAVE BALANCE
            // ============================================================
            function updateDefaults() {
                const entryNorm = normalizeTime(defaultEntryInput.value);
                const exitNorm = normalizeTime(defaultExitInput.value);

                if (entryNorm) {
                    defaultEntryInput.value = entryNorm;
                    state.defaultEntry = entryNorm;
                } else if (defaultEntryInput.value.trim() !== '') {
                    defaultEntryInput.value = state.defaultEntry;
                    showToast('ورود پیش‌فرض نامعتبر است');
                } else {
                    defaultEntryInput.value = state.defaultEntry;
                }

                if (exitNorm) {
                    defaultExitInput.value = exitNorm;
                    state.defaultExit = exitNorm;
                } else if (defaultExitInput.value.trim() !== '') {
                    defaultExitInput.value = state.defaultExit;
                    showToast('خروج پیش‌فرض نامعتبر است');
                } else {
                    defaultExitInput.value = state.defaultExit;
                }

                const balance = readLeaveBalanceInputs();
                if (balance !== null) {
                    state.leaveBalance = balance;
                } else {
                    setLeaveBalanceInputs(state.leaveBalance);
                    showToast('ساعت باید بین ۰ تا ۲۳ باشد و مقدارها معتبر باشند');
                }

                saveToStorage();
                renderTable();
                applyFilter(state.filter);
            }

            function allowNumericInput(event) {
                const input = event.target;
                if (!(input instanceof HTMLInputElement)) return;
                const isTime = input.classList.contains('time-input') || input.id === 'defaultEntry' || input.id === 'defaultExit';
                const isDigits = input.id === 'leaveBalanceDays' || input.id === 'leaveBalanceHours';
                if (!isTime && !isDigits) return;
                if (event.type === 'keydown') {
                    if (event.ctrlKey || event.metaKey || event.altKey || ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    if (isTime ? !/^[0-9:]$/.test(event.key) : !/^[0-9]$/.test(event.key)) event.preventDefault();
                } else {
                    input.value = input.value.replace(isTime ? /[^0-9:]/g : /[^0-9]/g, '');
                }
            }

            // ============================================================
            //  INIT
            // ============================================================
            function init() {
                const defaultMonth = populateSelects();

                const entryNorm = normalizeTime(defaultEntryInput.value) || '09:00';
                const exitNorm = normalizeTime(defaultExitInput.value) || '17:45';
                defaultEntryInput.value = entryNorm;
                defaultExitInput.value = exitNorm;
                state.defaultEntry = entryNorm;
                state.defaultExit = exitNorm;
                const balance = readLeaveBalanceInputs();
                state.leaveBalance = balance === null ? 0 : balance;
                setLeaveBalanceInputs(state.leaveBalance);

                const loaded = loadFromStorage();
                if (!loaded) {
                    state.days = {};
                }

                renderTable();
                applyFilter('all');

                // --- Event Listeners ---

                calcBtn.addEventListener('click', onMonthChange);

                monthSelect.addEventListener('change', function() {
                    state.month = parseInt(this.value, 10);
                    onMonthChange();
                });

                yearSelect.addEventListener('change', function() {
                    state.year = parseInt(this.value, 10);
                });

                defaultEntryInput.addEventListener('blur', updateDefaults);
                defaultExitInput.addEventListener('blur', updateDefaults);
                leaveBalanceHoursInput.addEventListener('blur', updateDefaults);
                leaveBalanceDaysInput.addEventListener('blur', updateDefaults);

                settings.querySelectorAll('input, select').forEach(input => {
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') moveToNextInput(this, e, settings, 'input:not([disabled]), select:not([disabled])');
                    });
                });

                filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        applyFilter(btn.dataset.filter);
                    });
                });

                resetBtn.addEventListener('click', resetMonth);
                exportBtn.addEventListener('click', exportFile);
                importBtn.addEventListener('click', () => importFile.click());
                importFile.addEventListener('change', function() {
                    if (this.files[0]) importFileData(this.files[0]);
                });
                confirmImportBtn.addEventListener('click', function() {
                    if (!pendingImportedDays) return;
                    state.days = pendingImportedDays;
                    saveToStorage();
                    renderTable();
                    applyFilter(state.filter);
                    closeImportPreview();
                    showToast('اطلاعات فایل با موفقیت وارد شد');
                });
                cancelImportBtn.addEventListener('click', closeImportPreview);
                importPreview.addEventListener('click', function(e) {
                    if (e.target === importPreview) closeImportPreview();
                });

                document.addEventListener('keydown', (e) => {
                    allowNumericInput(e);
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        onMonthChange();
                    }
                });
                document.addEventListener('input', allowNumericInput);

                // Show current month info
                const cur = getCurrentJalali();
                const monthName = MONTH_NAMES[cur.month - 1] || 'نامشخص';
                showToast(`ماه جاری: ${monthName} ${String(cur.year).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])}`);
            }

            document.addEventListener('DOMContentLoaded', init);

        })();
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';

type MuscleId =
  | 'lats'
  | 'upperBack'
  | 'biceps'
  | 'lowerBack'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'chest'
  | 'shoulders';

type ExerciseStage = 'warmup' | 'activation' | 'work';

type Exercise = {
  id: string;
  name: string;
  sets: number;
  muscles: MuscleId[];
  stage: ExerciseStage;
  note?: string;
};

type ProgramDay = {
  id: string;
  weekday: string;
  focus: string;
  title: string;
  description: string;
  placeholderNote?: string;
  exercises: Exercise[];
};

type Session = {
  id: string;
  cycleDayIndex: number;
  dateKey: string;
  createdAt: string;
  completedSets: Record<string, number>;
};

type StoredState = {
  sessions: Session[];
};

const STORAGE_KEY = 'coex.v1';
const REST_SECONDS = 60;

const COLORS = {
  night: '#060b09',
  canopy: '#10231a',
  shell: '#1d160f',
  panel: '#101714',
  panelStrong: '#16221d',
  panelSoft: '#1b2d24',
  line: '#31463c',
  mint: '#8bd17c',
  palm: '#58b66f',
  foam: '#e7f2d9',
  sand: '#cfbf8d',
  sandMuted: '#8f896e',
  ember: '#ffb569',
  berry: '#ff7f6e',
  aqua: '#75d8d2',
  sky: '#7bc6ff',
  rose: '#ff8ca3',
  violet: '#b79cff',
  black: '#040504',
};

const PIXEL_COCONUT = [
  '00111100',
  '01111110',
  '11011011',
  '11111111',
  '11111111',
  '01111110',
  '00111100',
  '00011000',
];

const MUSCLE_META: Record<
  MuscleId,
  { label: string; color: string; art: string[] }
> = {
  lats: {
    label: '背阔',
    color: COLORS.palm,
    art: ['10000001', '11000011', '11100111', '01111110', '00111100'],
  },
  upperBack: {
    label: '上背',
    color: COLORS.aqua,
    art: ['11111111', '01111110', '00111100', '01111110', '11000011'],
  },
  biceps: {
    label: '二头',
    color: COLORS.ember,
    art: ['00110000', '01111000', '11111100', '01111000', '00001100'],
  },
  lowerBack: {
    label: '下背',
    color: COLORS.sky,
    art: ['00011000', '00111100', '00111100', '00011000', '00011000'],
  },
  quads: {
    label: '股四',
    color: COLORS.sand,
    art: ['01100110', '01100110', '01100110', '01100110', '00111100'],
  },
  hamstrings: {
    label: '后链',
    color: COLORS.violet,
    art: ['11000011', '01100110', '00111100', '00111100', '00011000'],
  },
  glutes: {
    label: '臀',
    color: COLORS.rose,
    art: ['00100100', '01111110', '11111111', '01111110', '00111100'],
  },
  calves: {
    label: '小腿',
    color: COLORS.berry,
    art: ['01100110', '00100100', '00100100', '00100100', '00011000'],
  },
  chest: {
    label: '胸',
    color: COLORS.berry,
    art: ['11000011', '11100111', '01111110', '00111100', '00011000'],
  },
  shoulders: {
    label: '肩',
    color: COLORS.sky,
    art: ['11000011', '11111111', '00111100', '00111100', '00011000'],
  },
};

const PROGRAM: ProgramDay[] = [
  {
    id: 'monday-back',
    weekday: '周一',
    focus: '背',
    title: '黑椰背部日',
    description: '滑轮、引体和划船串成一条完整的拉力链。',
    exercises: [
      {
        id: 'back-warmup',
        name: '热身',
        sets: 1,
        muscles: ['lats', 'shoulders'],
        stage: 'warmup',
        note: '进入背部训练前先做一轮热身。',
      },
      {
        id: 'back-activation',
        name: '激活',
        sets: 1,
        muscles: ['lats', 'upperBack'],
        stage: 'activation',
        note: '把背阔和肩胛先叫醒。',
      },
      {
        id: 'lat-pulldown-a',
        name: '滑轮下拉',
        sets: 3,
        muscles: ['lats', 'biceps'],
        stage: 'work',
      },
      {
        id: 'pullup-wide',
        name: '引体向上 宽握',
        sets: 3,
        muscles: ['lats', 'upperBack', 'biceps'],
        stage: 'work',
      },
      {
        id: 'pullup-narrow',
        name: '引体向上 窄握',
        sets: 3,
        muscles: ['lats', 'biceps'],
        stage: 'work',
      },
      {
        id: 'machine-row',
        name: '固定器械划船',
        sets: 3,
        muscles: ['upperBack', 'lats', 'biceps'],
        stage: 'work',
      },
      {
        id: 'cable-row',
        name: '滑轮划船',
        sets: 3,
        muscles: ['upperBack', 'lats', 'biceps'],
        stage: 'work',
      },
      {
        id: 'lat-pulldown-b',
        name: '下拉终结',
        sets: 3,
        muscles: ['lats'],
        stage: 'work',
        note: '最后再补三组下拉收尾。',
      },
      {
        id: 'lower-back',
        name: '下背训练',
        sets: 3,
        muscles: ['lowerBack'],
        stage: 'work',
      },
    ],
  },
  {
    id: 'tuesday-legs',
    weekday: '周二',
    focus: '腿',
    title: '黑椰腿部日',
    description: '椭圆机和深蹲打底，再用后链把腿日压实。',
    exercises: [
      {
        id: 'legs-warmup',
        name: '椭圆机',
        sets: 1,
        muscles: ['quads', 'glutes', 'calves'],
        stage: 'warmup',
        note: '腿日热身。',
      },
      {
        id: 'legs-activation',
        name: '深蹲',
        sets: 1,
        muscles: ['quads', 'glutes', 'hamstrings'],
        stage: 'activation',
        note: '腿日激活。',
      },
      {
        id: 'deadlift',
        name: '硬拉',
        sets: 3,
        muscles: ['hamstrings', 'glutes', 'lowerBack'],
        stage: 'work',
      },
      {
        id: 'reverse-hack-hip',
        name: '反向哈克屈髋',
        sets: 3,
        muscles: ['glutes', 'hamstrings'],
        stage: 'work',
      },
      {
        id: 'leg-extension-front',
        name: '腿屈伸 正向',
        sets: 3,
        muscles: ['quads'],
        stage: 'work',
      },
      {
        id: 'leg-extension-reverse',
        name: '腿屈伸 反向',
        sets: 3,
        muscles: ['hamstrings'],
        stage: 'work',
      },
      {
        id: 'hamstring-machine',
        name: '固定器械腿后侧',
        sets: 3,
        muscles: ['hamstrings', 'glutes'],
        stage: 'work',
      },
    ],
  },
  {
    id: 'wednesday-chest',
    weekday: '周三',
    focus: '胸',
    title: '黑椰胸部日',
    description: '周三先保留结构，主练动作后续再补。',
    placeholderNote: '本版先把胸日框架留好，只开放热身和激活。',
    exercises: [
      {
        id: 'chest-warmup',
        name: '热身',
        sets: 1,
        muscles: ['chest', 'shoulders'],
        stage: 'warmup',
      },
      {
        id: 'chest-activation',
        name: '激活',
        sets: 1,
        muscles: ['chest', 'shoulders'],
        stage: 'activation',
      },
    ],
  },
  {
    id: 'thursday-legs',
    weekday: '周四',
    focus: '腿',
    title: '黑椰腿部日 II',
    description: '周四复用同一套腿日逻辑，继续循环。',
    exercises: [
      {
        id: 'legs-two-warmup',
        name: '椭圆机',
        sets: 1,
        muscles: ['quads', 'glutes', 'calves'],
        stage: 'warmup',
      },
      {
        id: 'legs-two-activation',
        name: '深蹲',
        sets: 1,
        muscles: ['quads', 'glutes', 'hamstrings'],
        stage: 'activation',
      },
      {
        id: 'deadlift-two',
        name: '硬拉',
        sets: 3,
        muscles: ['hamstrings', 'glutes', 'lowerBack'],
        stage: 'work',
      },
      {
        id: 'reverse-hack-hip-two',
        name: '反向哈克屈髋',
        sets: 3,
        muscles: ['glutes', 'hamstrings'],
        stage: 'work',
      },
      {
        id: 'leg-extension-front-two',
        name: '腿屈伸 正向',
        sets: 3,
        muscles: ['quads'],
        stage: 'work',
      },
      {
        id: 'leg-extension-reverse-two',
        name: '腿屈伸 反向',
        sets: 3,
        muscles: ['hamstrings'],
        stage: 'work',
      },
      {
        id: 'hamstring-machine-two',
        name: '固定器械腿后侧',
        sets: 3,
        muscles: ['hamstrings', 'glutes'],
        stage: 'work',
      },
    ],
  },
  {
    id: 'friday-shoulder-glute',
    weekday: '周五',
    focus: '肩/臀',
    title: '黑椰肩臀日',
    description: '周五先保留结构，主练动作后续再补。',
    placeholderNote: '本版先把肩臀日框架留好，只开放热身和激活。',
    exercises: [
      {
        id: 'shoulder-glute-warmup',
        name: '热身',
        sets: 1,
        muscles: ['shoulders', 'glutes'],
        stage: 'warmup',
      },
      {
        id: 'shoulder-glute-activation',
        name: '激活',
        sets: 1,
        muscles: ['shoulders', 'glutes'],
        stage: 'activation',
      },
    ],
  },
];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string) {
  const parts = dateKey.split('-');

  if (parts.length !== 3) {
    return dateKey;
  }

  return `${parts[1]}/${parts[2]}`;
}

function formatTimer(seconds: number) {
  const minutes = `${Math.floor(seconds / 60)}`.padStart(2, '0');
  const rest = `${seconds % 60}`.padStart(2, '0');
  return `${minutes}:${rest}`;
}

function getSetCount(session: Session, exerciseId: string) {
  return session.completedSets[exerciseId] ?? 0;
}

function getSessionCompletedSets(session: Session) {
  return Object.values(session.completedSets).reduce((sum, count) => sum + count, 0);
}

function getSessionTotalSets(day: ProgramDay) {
  return day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}

function isSessionComplete(session: Session) {
  const day = PROGRAM[session.cycleDayIndex];
  return day.exercises.every((exercise) => getSetCount(session, exercise.id) >= exercise.sets);
}

function getCompletedSessionCount(sessions: Session[]) {
  return sessions.filter(isSessionComplete).length;
}

function getCurrentSession(sessions: Session[]) {
  const lastSession = sessions[sessions.length - 1];

  if (!lastSession) {
    return null;
  }

  if (!isSessionComplete(lastSession)) {
    return lastSession;
  }

  return lastSession.dateKey === getDateKey(new Date()) ? lastSession : null;
}

function getNextDayIndex(sessions: Session[]) {
  if (!sessions.length) {
    return 0;
  }

  const lastSession = sessions[sessions.length - 1];

  if (!isSessionComplete(lastSession)) {
    return lastSession.cycleDayIndex;
  }

  return (lastSession.cycleDayIndex + 1) % PROGRAM.length;
}

function getCycleNumber(sessions: Session[]) {
  return Math.floor(getCompletedSessionCount(sessions) / PROGRAM.length) + 1;
}

function getDayMuscles(day: ProgramDay) {
  return Array.from(new Set(day.exercises.flatMap((exercise) => exercise.muscles)));
}

function getActivatedMuscles(session: Session, day: ProgramDay) {
  const activated = new Set<MuscleId>();

  day.exercises.forEach((exercise) => {
    if (getSetCount(session, exercise.id) > 0) {
      exercise.muscles.forEach((muscle) => activated.add(muscle));
    }
  });

  return activated;
}

function getStageLabel(stage: ExerciseStage) {
  if (stage === 'warmup') {
    return '热身';
  }

  if (stage === 'activation') {
    return '激活';
  }

  return '主练';
}

function PixelArt({
  art,
  color,
  size = 6,
  emptyColor = 'transparent',
}: {
  art: string[];
  color: string;
  size?: number;
  emptyColor?: string;
}) {
  return (
    <View style={{ gap: 1 }}>
      {art.map((row, rowIndex) => (
        <View key={`${row}-${rowIndex}`} style={{ flexDirection: 'row', gap: 1 }}>
          {row.split('').map((cell, cellIndex) => (
            <View
              key={`${rowIndex}-${cellIndex}`}
              style={{
                width: size,
                height: size,
                backgroundColor: cell === '1' ? color : emptyColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function hydrateState() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as StoredState;

        if (isMounted && Array.isArray(parsed.sessions)) {
          setSessions(parsed.sessions);
        }
      } catch {
        // Ignore malformed local data and let the app boot cleanly.
      } finally {
        if (isMounted) {
          setHydrated(true);
        }
      }
    }

    void hydrateState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const state: StoredState = { sessions };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, sessions]);

  useEffect(() => {
    if (!restEndsAt) {
      setRestSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const seconds = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestSecondsLeft(seconds);

      if (seconds <= 0) {
        setRestEndsAt(null);
        Vibration.vibrate(220);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 250);

    return () => clearInterval(interval);
  }, [restEndsAt]);

  const currentSession = getCurrentSession(sessions);
  const nextDayIndex = getNextDayIndex(sessions);
  const currentDay = PROGRAM[currentSession?.cycleDayIndex ?? nextDayIndex];
  const todayMuscles = getDayMuscles(currentDay);
  const activatedMuscles = currentSession
    ? getActivatedMuscles(currentSession, currentDay)
    : new Set<MuscleId>();
  const sessionTotalSets = getSessionTotalSets(currentDay);
  const sessionCompletedSets = currentSession ? getSessionCompletedSets(currentSession) : 0;
  const sessionIsComplete = currentSession ? isSessionComplete(currentSession) : false;
  const todayKey = getDateKey(new Date());
  const carriedOver = Boolean(
    currentSession && !sessionIsComplete && currentSession.dateKey !== todayKey,
  );

  function startSession() {
    const session: Session = {
      id: `${Date.now()}`,
      cycleDayIndex: nextDayIndex,
      dateKey: todayKey,
      createdAt: new Date().toISOString(),
      completedSets: {},
    };

    setSessions((current) => [...current, session]);
  }

  function setExerciseCount(exercise: Exercise, targetCount: number) {
    if (!currentSession) {
      return;
    }

    const currentCount = getSetCount(currentSession, exercise.id);
    const clamped = Math.max(0, Math.min(exercise.sets, targetCount));
    const nextCount = currentCount === clamped ? Math.max(0, clamped - 1) : clamped;

    if (nextCount === currentCount) {
      return;
    }

    const updatedSession: Session = {
      ...currentSession,
      completedSets: {
        ...currentSession.completedSets,
        [exercise.id]: nextCount,
      },
    };

    setSessions((current) =>
      current.map((session) => (session.id === currentSession.id ? updatedSession : session)),
    );

    if (nextCount > currentCount && !isSessionComplete(updatedSession)) {
      setRestEndsAt(Date.now() + REST_SECONDS * 1000);
    }
  }

  function resetCurrentSession() {
    if (!currentSession) {
      return;
    }

    Alert.alert('重置今天', '要把今天已经点亮的组数全部清空吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '重置',
        style: 'destructive',
        onPress: () => {
          setRestEndsAt(null);
          setSessions((current) =>
            current.map((session) =>
              session.id === currentSession.id ? { ...session, completedSets: {} } : session,
            ),
          );
        },
      },
    ]);
  }

  function getDayStatus(index: number) {
    if (currentSession) {
      if (index < currentSession.cycleDayIndex) {
        return 'done';
      }

      if (index === currentSession.cycleDayIndex) {
        return sessionIsComplete ? 'done' : 'live';
      }

      return 'idle';
    }

    if (index < nextDayIndex) {
      return 'done';
    }

    if (index === nextDayIndex) {
      return 'next';
    }

    return 'idle';
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={[COLORS.night, '#07120d', COLORS.shell]} style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoFrame}>
              <PixelArt art={PIXEL_COCONUT} color={COLORS.palm} size={7} emptyColor={COLORS.black} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerEyebrow}>PIXEL COCONUT TRAINING</Text>
              <Text style={styles.headerTitle}>coex</Text>
              <Text style={styles.headerSubtitle}>暗系像素椰岛打卡 · 五天训练循环</Text>
            </View>
            <View style={styles.cycleBadge}>
              <Text style={styles.cycleBadgeLabel}>第 {getCycleNumber(sessions)} 轮</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroDayLabel}>{currentDay.weekday}</Text>
                <Text style={styles.heroTitle}>{currentDay.title}</Text>
                <Text style={styles.heroDescription}>{currentDay.description}</Text>
              </View>
              <View style={styles.heroFocusChip}>
                <Text style={styles.heroFocusChipText}>{currentDay.focus}</Text>
              </View>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>完成组数</Text>
                <Text style={styles.statValue}>
                  {sessionCompletedSets}/{sessionTotalSets}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>今日状态</Text>
                <Text style={styles.statValue}>
                  {!hydrated
                    ? '载入中'
                    : currentSession
                      ? sessionIsComplete
                        ? '已收工'
                        : carriedOver
                          ? '续练'
                          : '训练中'
                      : '待开练'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>休息倒计时</Text>
                <Text style={styles.statValue}>{formatTimer(restSecondsLeft)}</Text>
              </View>
            </View>

            {currentDay.placeholderNote ? (
              <View style={styles.placeholderBanner}>
                <Text style={styles.placeholderText}>{currentDay.placeholderNote}</Text>
              </View>
            ) : null}

            {carriedOver ? (
              <Text style={styles.carryText}>你正在继续 {formatDate(currentSession?.dateKey ?? '')} 的训练。</Text>
            ) : null}
          </View>

          <View style={styles.cycleRow}>
            {PROGRAM.map((day, index) => {
              const status = getDayStatus(index);

              return (
                <View
                  key={day.id}
                  style={[
                    styles.cyclePill,
                    status === 'done' && styles.cyclePillDone,
                    status === 'live' && styles.cyclePillLive,
                    status === 'next' && styles.cyclePillNext,
                  ]}
                >
                  <Text style={styles.cyclePillDay}>{day.weekday}</Text>
                  <Text style={styles.cyclePillFocus}>{day.focus}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.timerCard}>
            <View>
              <Text style={styles.timerTitle}>组间自动休息</Text>
              <Text style={styles.timerCopy}>每做完一组，自动开始 60 秒倒计时；结束会响一声。</Text>
            </View>
            <View style={styles.timerActions}>
              <Pressable style={styles.timerButton} onPress={() => setRestEndsAt(Date.now() + 60000)}>
                <Text style={styles.timerButtonText}>重开 60s</Text>
              </Pressable>
              {restEndsAt ? (
                <Pressable style={styles.timerGhostButton} onPress={() => setRestEndsAt(null)}>
                  <Text style={styles.timerGhostButtonText}>跳过</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.muscleSection}>
            <Text style={styles.sectionTitle}>今日肌群点亮</Text>
            <View style={styles.muscleGrid}>
              {todayMuscles.map((muscle) => {
                const meta = MUSCLE_META[muscle];
                const lit = activatedMuscles.has(muscle);

                return (
                  <View key={muscle} style={[styles.muscleCard, lit && styles.muscleCardLit]}>
                    <PixelArt
                      art={meta.art}
                      color={lit ? meta.color : COLORS.sandMuted}
                      size={5}
                      emptyColor="transparent"
                    />
                    <Text style={[styles.muscleLabel, lit && styles.muscleLabelLit]}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {!hydrated ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>正在读取你的本地训练记录</Text>
            </View>
          ) : null}

          {hydrated && !currentSession ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {sessions.length ? '准备开启下一训练日' : '从周一第一次打卡开始循环'}
              </Text>
              <Text style={styles.emptyCopy}>
                {sessions.length
                  ? `下一站是 ${currentDay.weekday} · ${currentDay.title}`
                  : '按下按钮后会把今天记成第 1 天，也就是周一背部日。'}
              </Text>
              <Pressable style={styles.primaryButton} onPress={startSession}>
                <Text style={styles.primaryButtonText}>
                  {sessions.length ? `开始 ${currentDay.weekday}` : '开始周一循环'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {hydrated && currentSession ? (
            <View style={styles.exerciseSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>训练打卡</Text>
                <Pressable onPress={resetCurrentSession}>
                  <Text style={styles.resetLink}>重置今天</Text>
                </Pressable>
              </View>

              {currentDay.exercises.map((exercise) => {
                const primaryMuscle = MUSCLE_META[exercise.muscles[0]];
                const completed = getSetCount(currentSession, exercise.id);
                const done = completed >= exercise.sets;

                return (
                  <View key={exercise.id} style={[styles.exerciseCard, done && styles.exerciseCardDone]}>
                    <View style={styles.exerciseTopRow}>
                      <View style={styles.exerciseTitleWrap}>
                        <View style={styles.exerciseBadgeRow}>
                          <View style={styles.stageBadge}>
                            <Text style={styles.stageBadgeText}>{getStageLabel(exercise.stage)}</Text>
                          </View>
                          <Text style={styles.exerciseSetsLabel}>{exercise.sets} 组</Text>
                        </View>
                        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                        {exercise.note ? <Text style={styles.exerciseNote}>{exercise.note}</Text> : null}
                      </View>
                      <View style={styles.exerciseIconWrap}>
                        <PixelArt
                          art={primaryMuscle.art}
                          color={done ? primaryMuscle.color : COLORS.sandMuted}
                          size={5}
                          emptyColor="transparent"
                        />
                      </View>
                    </View>

                    <View style={styles.muscleChipRow}>
                      {exercise.muscles.map((muscle) => {
                        const meta = MUSCLE_META[muscle];
                        const active = completed > 0;

                        return (
                          <View key={`${exercise.id}-${muscle}`} style={styles.muscleChip}>
                            <PixelArt
                              art={meta.art}
                              color={active ? meta.color : COLORS.sandMuted}
                              size={3}
                              emptyColor="transparent"
                            />
                            <Text style={[styles.muscleChipText, active && styles.muscleChipTextLit]}>
                              {meta.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.setRow}>
                      {Array.from({ length: exercise.sets }, (_, index) => {
                        const filled = index < completed;

                        return (
                          <Pressable
                            key={`${exercise.id}-${index + 1}`}
                            style={[
                              styles.setDot,
                              filled && {
                                backgroundColor: primaryMuscle.color,
                                borderColor: primaryMuscle.color,
                              },
                            ]}
                            onPress={() => setExerciseCount(exercise, index + 1)}
                          >
                            <Text style={[styles.setDotText, filled && styles.setDotTextFilled]}>
                              {index + 1}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {sessionIsComplete ? (
                <View style={styles.completeBanner}>
                  <Text style={styles.completeBannerTitle}>今天的训练已经打满。</Text>
                  <Text style={styles.completeBannerCopy}>明天打开 app 就会自动准备下一训练日。</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>当前版本已完成</Text>
            <Text style={styles.footerCopy}>周一背部日、周二腿日、周四腿日的完整动作和组数。</Text>
            <Text style={styles.footerCopy}>周三胸日、周五肩臀日先保留热身和激活占位，方便你继续补动作。</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.night,
  },
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoFrame: {
    width: 82,
    height: 82,
    borderWidth: 2,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panelStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  headerEyebrow: {
    color: COLORS.sandMuted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  headerTitle: {
    color: COLORS.foam,
    fontSize: 30,
    letterSpacing: 1,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: COLORS.sand,
    fontSize: 12,
    lineHeight: 18,
  },
  cycleBadge: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cycleBadgeLabel: {
    color: COLORS.mint,
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'rgba(16, 23, 20, 0.92)',
    padding: 16,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroDayLabel: {
    color: COLORS.mint,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: COLORS.foam,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  heroDescription: {
    color: COLORS.sand,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 240,
  },
  heroFocusChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.palm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.foam,
  },
  heroFocusChipText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '900',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panelSoft,
    padding: 12,
    gap: 8,
  },
  statLabel: {
    color: COLORS.sandMuted,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  statValue: {
    color: COLORS.foam,
    fontSize: 18,
    fontWeight: '900',
  },
  placeholderBanner: {
    borderWidth: 1,
    borderColor: COLORS.ember,
    backgroundColor: 'rgba(255, 181, 105, 0.08)',
    padding: 12,
  },
  placeholderText: {
    color: COLORS.ember,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  carryText: {
    color: COLORS.aqua,
    fontSize: 12,
    fontWeight: '700',
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cyclePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(16, 23, 20, 0.7)',
    alignItems: 'center',
    gap: 4,
  },
  cyclePillDone: {
    backgroundColor: 'rgba(88, 182, 111, 0.18)',
    borderColor: COLORS.palm,
  },
  cyclePillLive: {
    backgroundColor: 'rgba(117, 216, 210, 0.16)',
    borderColor: COLORS.aqua,
  },
  cyclePillNext: {
    backgroundColor: 'rgba(123, 198, 255, 0.12)',
    borderColor: COLORS.sky,
  },
  cyclePillDay: {
    color: COLORS.sandMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  cyclePillFocus: {
    color: COLORS.foam,
    fontSize: 13,
    fontWeight: '900',
  },
  timerCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  timerTitle: {
    color: COLORS.foam,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  timerCopy: {
    color: COLORS.sand,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 220,
  },
  timerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timerButton: {
    backgroundColor: COLORS.foam,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.foam,
  },
  timerButtonText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
  },
  timerGhostButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timerGhostButtonText: {
    color: COLORS.aqua,
    fontSize: 12,
    fontWeight: '800',
  },
  muscleSection: {
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.foam,
    fontSize: 18,
    fontWeight: '900',
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  muscleCard: {
    minWidth: 84,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  muscleCardLit: {
    backgroundColor: COLORS.panelSoft,
  },
  muscleLabel: {
    color: COLORS.sandMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  muscleLabelLit: {
    color: COLORS.foam,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    padding: 18,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.foam,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyCopy: {
    color: COLORS.sand,
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.palm,
    borderWidth: 1,
    borderColor: COLORS.foam,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '900',
  },
  exerciseSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetLink: {
    color: COLORS.berry,
    fontSize: 12,
    fontWeight: '800',
  },
  exerciseCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'rgba(16, 23, 20, 0.92)',
    padding: 14,
    gap: 12,
  },
  exerciseCardDone: {
    backgroundColor: 'rgba(88, 182, 111, 0.12)',
    borderColor: COLORS.palm,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseTitleWrap: {
    flex: 1,
    gap: 6,
  },
  exerciseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panelSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stageBadgeText: {
    color: COLORS.aqua,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  exerciseSetsLabel: {
    color: COLORS.sandMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  exerciseTitle: {
    color: COLORS.foam,
    fontSize: 20,
    fontWeight: '900',
  },
  exerciseNote: {
    color: COLORS.sand,
    fontSize: 12,
    lineHeight: 18,
  },
  exerciseIconWrap: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panelStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
  },
  muscleChipText: {
    color: COLORS.sandMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  muscleChipTextLit: {
    color: COLORS.foam,
  },
  setRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  setDot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panelSoft,
  },
  setDotText: {
    color: COLORS.sandMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  setDotTextFilled: {
    color: COLORS.black,
  },
  completeBanner: {
    borderWidth: 1,
    borderColor: COLORS.palm,
    backgroundColor: 'rgba(88, 182, 111, 0.12)',
    padding: 14,
    gap: 6,
  },
  completeBannerTitle: {
    color: COLORS.foam,
    fontSize: 16,
    fontWeight: '900',
  },
  completeBannerCopy: {
    color: COLORS.sand,
    fontSize: 12,
    lineHeight: 18,
  },
  footerCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    padding: 14,
    gap: 6,
  },
  footerTitle: {
    color: COLORS.foam,
    fontSize: 14,
    fontWeight: '900',
  },
  footerCopy: {
    color: COLORS.sand,
    fontSize: 12,
    lineHeight: 18,
  },
});

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {api} from '../api/client';
import type {AcademyStackParamList} from '../navigation/MainTabs';
import {useUserContext} from '../context/UserContext';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {localeFormatNum} from '../utils/fortune';

type LangCode = 'en' | 'ru' | 'uk';
type Localized = Partial<Record<LangCode, string>>;

type AnswerOpt = {
  text: Localized;
  isCorrect: boolean;
};

type QuestionRow = {
  question: Localized;
  answers: AnswerOpt[];
};

type AcademyLesson = {
  lessonId: number;
  title?: Localized;
  questions?: QuestionRow[];
};

type ResultEntry = {
  selected: string | null;
  isCorrect: boolean;
  timeSpent: number;
  correctAnswer: string;
  questionText: string;
  answers: {text: string; isCorrect: boolean}[];
};

const GATE_KEY = (lessonId: number) => `academyTestGate_${lessonId}`;
const QUESTION_SEC = 60;
const MAX_QUESTIONS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickLang(lang: LangCode, loc?: Localized): string {
  if (!loc) {
    return '';
  }
  return loc[lang] ?? loc.en ?? loc.ru ?? '';
}

export function AcademyTestScreen() {
  const {t, i18n} = useTranslation();
  const nav =
    useNavigation<NativeStackNavigationProp<AcademyStackParamList>>();
  const route = useRoute<RouteProp<AcademyStackParamList, 'AcademyTest'>>();
  const {lessonId} = route.params;
  const {refetchUser} = useUserContext();
  const queryClient = useQueryClient();

  const lang: LangCode = ['ru', 'uk'].includes(i18n.language)
    ? (i18n.language.split('-')[0] as LangCode)
    : 'en';

  const [gateOk, setGateOk] = useState<boolean | null>(null);

  const [prepared, setPrepared] = useState<QuestionRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctReveal, setCorrectReveal] = useState<string | null>(null);
  const [results, setResults] = useState<(ResultEntry | null)[]>([]);
  const resultsRef = useRef<(ResultEntry | null)[]>([]);
  const [showFinal, setShowFinal] = useState(false);
  const [remaining, setRemaining] = useState(QUESTION_SEC);

  const questionStartedAt = useRef(Date.now());
  const idxRef = useRef(0);
  const checkedRef = useRef(false);
  const selectedRef = useRef<string | null>(null);
  const showFinalRef = useRef(false);
  const preparedRef = useRef<QuestionRow[]>([]);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);
  useEffect(() => {
    checkedRef.current = checked;
  }, [checked]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    showFinalRef.current = showFinal;
  }, [showFinal]);
  useEffect(() => {
    preparedRef.current = prepared;
  }, [prepared]);

  const {data: lesson, isLoading, isError} = useQuery({
    queryKey: ['academy', lessonId],
    queryFn: async () =>
      (await api.get<AcademyLesson>(`/api/academies/${lessonId}`)).data,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const g = await AsyncStorage.getItem(GATE_KEY(lessonId));
      if (!alive) {
        return;
      }
      if (g !== '1') {
        nav.goBack();
        setGateOk(false);
      } else {
        await AsyncStorage.removeItem(GATE_KEY(lessonId));
        setGateOk(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lessonId, nav]);

  useEffect(() => {
    if (!lesson?.questions?.length) {
      setPrepared([]);
      return;
    }
    const qs = shuffle([...lesson.questions])
      .slice(0, MAX_QUESTIONS)
      .map(q => ({
        ...q,
        answers: shuffle([...q.answers]),
      }));
    setPrepared(qs);
    setResults(new Array(qs.length).fill(null));
    resultsRef.current = new Array(qs.length).fill(null);
    setIdx(0);
    setChecked(false);
    setSelected(null);
    setCorrectReveal(null);
    setShowFinal(false);
  }, [lesson]);

  useEffect(() => {
    questionStartedAt.current = Date.now();
    setRemaining(QUESTION_SEC);
    setChecked(false);
    setSelected(null);
    setCorrectReveal(null);
  }, [idx]);

  const recordAnswer = useCallback(
    (selectedText: string | null, forceIdx?: number) => {
      const i = forceIdx ?? idxRef.current;
      const q = preparedRef.current[i];
      if (!q) {
        return;
      }
      const correctText =
        q.answers.find(a => a.isCorrect)?.text[lang] ??
        q.answers.find(a => a.isCorrect)?.text.en ??
        '';
      const isCorrect = !!selectedText && selectedText === correctText;
      const timeSpent = Date.now() - questionStartedAt.current;
      const entry: ResultEntry = {
        selected: selectedText,
        isCorrect,
        timeSpent,
        correctAnswer: correctText,
        questionText: pickLang(lang, q.question),
        answers: q.answers.map(a => ({
          text: pickLang(lang, a.text),
          isCorrect: a.isCorrect,
        })),
      };
      setResults(prev => {
        const next = [...prev];
        next[i] = entry;
        resultsRef.current = next;
        return next;
      });
      setCorrectReveal(correctText);
      setChecked(true);
    },
    [lang],
  );

  const submitServer = useMutation({
    mutationFn: async (payload: {
      lessonId: number;
      correctAnswers: number;
      incorrectAnswers: number;
      points: number;
      completed: boolean;
    }) => {
      const {data} = await api.put('/api/academy-results/update', payload);
      return data;
    },
    onSuccess: async () => {
      await refetchUser();
      await queryClient.invalidateQueries({queryKey: ['academies']});
      await queryClient.invalidateQueries({queryKey: ['academy', lessonId]});
      await queryClient.invalidateQueries({queryKey: ['academyLessonTop', lessonId]});
      await queryClient.invalidateQueries({queryKey: ['academyGlobalTop']});
    },
  });

  const finalizeAndShow = useCallback(
    (list: (ResultEntry | null)[]) => {
      const correctAnswers = list.filter(r => r?.isCorrect).length;
      const incorrectAnswers = list.filter(
        r => r && !r.isCorrect,
      ).length;
      const totalPoints = list.reduce((acc, r) => {
        if (r?.isCorrect) {
          return acc + Math.max(0, 60000 - r.timeSpent);
        }
        return acc;
      }, 0);

      submitServer.mutate(
        {
          lessonId,
          correctAnswers,
          incorrectAnswers,
          points: totalPoints,
          completed: true,
        },
        {
          onSuccess: () => setShowFinal(true),
          onError: () => {
            Alert.alert(
              t('Error'),
              t('An unexpected error occurred while updating the wallet.:', {
                defaultValue: 'Could not save results.',
              }),
            );
            setShowFinal(true);
          },
        },
      );
    },
    [lessonId, submitServer, t],
  );

  const timeUp = useCallback(() => {
    if (checkedRef.current || showFinalRef.current) {
      return;
    }
    const curIdx = idxRef.current;
    recordAnswer(selectedRef.current, curIdx);
    setTimeout(() => {
      const list = resultsRef.current;
      const len = preparedRef.current.length;
      if (curIdx + 1 < len) {
        setIdx(curIdx + 1);
      } else {
        finalizeAndShow(list);
      }
    }, 40);
  }, [finalizeAndShow, recordAnswer]);

  useEffect(() => {
    if (gateOk !== true || showFinal || prepared.length === 0) {
      return;
    }
    if (checked) {
      return;
    }

    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval);
          queueMicrotask(() => timeUp());
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gateOk, showFinal, prepared.length, checked, idx, timeUp]);

  const onPressCheck = () => {
    if (!selected || checked) {
      return;
    }
    recordAnswer(selected);
  };

  const onPressNext = () => {
    if (!checked) {
      return;
    }
    const list = resultsRef.current;
    if (idx + 1 < prepared.length) {
      setIdx(i => i + 1);
    } else {
      finalizeAndShow(list);
    }
  };

  const lessonTitle = pickLang(lang, lesson?.title);

  if (gateOk !== true || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{t('Error loading academies.')}</Text>
      </View>
    );
  }

  const q = prepared[idx];

  if (showFinal) {
    const finalRows = results.filter((x): x is ResultEntry => x != null);
    return (
      <AcademyTestResults
        results={finalRows}
        lessonTitle={lessonTitle}
        lessonId={lesson.lessonId}
        onGoBack={() => nav.navigate('AcademyDetail', {lessonId})}
      />
    );
  }

  if (!q || prepared.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{t('No questions')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.lessonHead}>
        [{t('Lesson')} {lesson.lessonId}]: {lessonTitle || '…'}
      </Text>

      <View style={styles.qHead}>
        <Text style={styles.question}>
          {pickLang(lang, q.question)}
        </Text>
        <View style={styles.timerRing}>
          <Text style={styles.timerTxt}>{remaining}</Text>
        </View>
      </View>

      <View style={styles.dots}>
        {prepared.map((_, i) => {
          const r = results[i];
          let bg = colors.barFill;
          if (r?.isCorrect) {
            bg = '#39C73E';
          } else if (r?.selected != null) {
            bg = colors.primary;
          }
          return <View key={i} style={[styles.dot, {backgroundColor: bg}]} />;
        })}
      </View>

      <View style={styles.opts}>
        {q.answers.map((opt, i) => {
          const label = pickLang(lang, opt.text);
          const sel = selected === label;
          const correct = checked && label === correctReveal;
          const wrong = checked && sel && !correct;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.opt,
                sel && styles.optSel,
                correct && styles.optCorrect,
                wrong && styles.optWrong,
              ]}
              activeOpacity={0.85}
              disabled={checked}
              onPress={() => !checked && setSelected(label)}>
              <Text style={styles.optTxt}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actions}>
        {!checked ? (
          <TouchableOpacity
            style={[styles.mainBtn, !selected && styles.mainBtnDis]}
            disabled={!selected}
            onPress={onPressCheck}>
            <Text style={styles.mainBtnTxt}>{t('Check Answer')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.mainBtn} onPress={onPressNext}>
            <Text style={styles.mainBtnTxt}>{t('Next Question')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function resultDotColor(r: ResultEntry): string {
  if (r.isCorrect) {
    return '#39C73E';
  }
  if (r.selected != null) {
    return colors.primary;
  }
  return colors.barFill;
}

function AcademyTestResults({
  results,
  lessonTitle,
  lessonId,
  onGoBack,
}: {
  results: ResultEntry[];
  lessonTitle: string;
  lessonId: number;
  onGoBack: () => void;
}) {
  const {t} = useTranslation();
  const correctN = results.filter(r => r.isCorrect).length;
  const totalN = results.length;
  const examPassed = correctN === totalN && totalN > 0;
  const totalPoints = results.reduce((acc, r) => {
    if (r.isCorrect) {
      return acc + Math.max(0, 60000 - r.timeSpent);
    }
    return acc;
  }, 0);
  const avgSec =
    totalN > 0
      ? results.reduce((a, r) => a + r.timeSpent, 0) / totalN / 1000
      : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.pad}>
      <Text style={styles.lessonHead}>
        [{t('Lesson')} {lessonId}]{'\n'}
        {lessonTitle || '…'}
      </Text>

      <Text
        style={[
          styles.examStatus,
          !examPassed && styles.examStatusBad,
        ]}>
        {t(examPassed ? 'Exam Passed' : 'Exam Not Passed')}
      </Text>

      <View style={styles.dots}>
        {results.map((r, i) => (
          <View
            key={i}
            style={[styles.dot, {backgroundColor: resultDotColor(r)}]}
          />
        ))}
      </View>

      <Text style={styles.resultsLbl}>{t('Results')}:</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.statOk]}>
          <Text style={styles.bigNum}>{correctN}</Text>
          <Text style={styles.statCap}>{t('Correct')}</Text>
        </View>
        <View style={[styles.statBox, styles.statBad]}>
          <Text style={styles.bigNum}>{totalN - correctN}</Text>
          <Text style={styles.statCap}>{t('Incorrect')}</Text>
        </View>
      </View>

      <View style={styles.metaBlk}>
        <Text style={styles.metaLine}>
          {t('Time/ques')}: {avgSec.toFixed(1)} {t('seconds')}
        </Text>
        <Text style={styles.metaLine}>
          {t('Total Points')}: {totalPoints.toLocaleString()}
        </Text>
      </View>

      <Text style={styles.detailHead}>{t('Results')}:</Text>
      {results.map((r, i) => (
        <View
          key={i}
          style={[
            styles.qBlock,
            r.isCorrect ? styles.qBlockOk : styles.qBlockBad,
          ]}>
          <Text style={styles.qTitle}>
            {i + 1}. {r.questionText}
          </Text>
          {r.answers.map((a, j) => {
            const picked = r.selected === a.text;
            const isCorr = a.isCorrect;
            return (
              <Text
                key={j}
                style={[
                  styles.ansLine,
                  picked && isCorr && styles.ansCorr,
                  picked && !isCorr && styles.ansWrong,
                  !picked && isCorr && styles.ansCorrHint,
                ]}>
                {a.text}
              </Text>
            );
          })}
          <Text style={styles.timeSpent}>
            {t('Time spent')}:{' '}
            {localeFormatNum((r.timeSpent ?? 0) / 1000, undefined, 2)}{' '}
            {t('s')}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.mainBtn} onPress={onGoBack}>
        <Text style={styles.mainBtnTxt}>{t('Go Back')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  pad: {paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12},
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  err: {
    color: colors.error,
    fontFamily: fontFamily.regular,
  },
  lessonHead: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    fontFamily: fontFamily.semibold,
  },
  qHead: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  question: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
    fontFamily: fontFamily.bold,
  },
  timerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: '#39C73E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tabStrip,
  },
  timerTxt: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  opts: {gap: 10, marginBottom: 24},
  opt: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  optSel: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optCorrect: {
    borderColor: '#39C73E',
    backgroundColor: 'rgba(57, 199, 62, 0.12)',
  },
  optWrong: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(230, 33, 89, 0.12)',
  },
  optTxt: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
  },
  actions: {marginTop: 8},
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mainBtnDis: {
    opacity: 0.45,
  },
  mainBtnTxt: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  examStatus: {
    fontSize: 22,
    fontWeight: '700',
    color: '#39C73E',
    marginBottom: 12,
    fontFamily: fontFamily.bold,
  },
  examStatusBad: {
    color: colors.primary,
  },
  resultsLbl: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    fontFamily: fontFamily.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
  },
  statOk: {
    backgroundColor: 'rgba(57, 199, 62, 0.15)',
  },
  statBad: {
    backgroundColor: 'rgba(230, 33, 89, 0.12)',
  },
  bigNum: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  statCap: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  metaBlk: {
    marginBottom: 20,
    gap: 6,
  },
  metaLine: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
  },
  detailHead: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  qBlock: {
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  qBlockOk: {
    borderColor: 'rgba(57, 199, 62, 0.4)',
    backgroundColor: 'rgba(57, 199, 62, 0.08)',
  },
  qBlockBad: {
    borderColor: 'rgba(230, 33, 89, 0.35)',
    backgroundColor: 'rgba(230, 33, 89, 0.06)',
  },
  qTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
    fontFamily: fontFamily.semibold,
  },
  ansLine: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
    fontFamily: fontFamily.regular,
  },
  ansCorr: {
    color: '#39C73E',
    fontWeight: '600',
  },
  ansWrong: {
    color: colors.primary,
    fontWeight: '600',
  },
  ansCorrHint: {
    color: '#39C73E',
  },
  timeSpent: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
});

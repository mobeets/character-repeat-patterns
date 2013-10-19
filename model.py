import csv
from nltk.corpus import words
from pattern import repeated_digits_summing_to

class Patterns:
    def __init__(self, words):
        self.words = words
        
        self.lookup = repeated_digits_summing_to(self.nx())
        self.patterns = dict((key, [val for val in self.lookup[key]]) for key in self.lookup)

        self.counts = self.count_patterns(words)

    def nx(self):
        return max([len(w) for w in self.words])

    def ny(self, xs):
        return max([len(x) for x in xs.values()])

    def pattern_hash_inner(self, word):
        w = set(word)
        return sorted([word.count(i) for i in w])

    def pair(self, word):
        key = len(word)
        val = tuple(self.pattern_hash_inner(word))
        return (key, self.patterns[key].index(val))

    def count_patterns(self, words):
        max_ind = self.ny(self.lookup)
        counts = dict((key, [0]*max_ind) for key in self.lookup)
        for word in words:
            (key, ind) = self.pair(word)
            assert self.patterns[key][ind] == tuple(self.pattern_hash_inner(word))
            counts[key][ind] += 1
        return counts

def freq_per_pattern(words):
    P = Patterns(words)
    rows = []
    for nchars, freqs in P.counts.iteritems():
        for i, pattern in enumerate(P.patterns[nchars]):
            val = freqs[i]
            pattern_str = P.pattern_hash_str_inner(pattern)
            rows.append({'group': nchars, 'key': pattern_str, 'val': val})
    return rows

def freq_per_pattern_csv(words, outfile):
    rows = freq_per_pattern(words)
    cols = ['group','key','val']
    with open(outfile, 'wb') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(cols)
        csvwriter.writerows([[row[col] for col in cols] for row in rows])

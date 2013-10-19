from copy import copy

def add_one_to_index(coll, i):
    coll = list(coll)
    prev = coll[:i]
    mid = [coll[i]+1]
    aft = coll[i+1:]
    return prev + mid + aft

def add_one_to_end(coll):
    return coll + (1,)

def hashit(coll):
    return tuple(sorted(coll))

def repeated_digits_summing_to(N):

    sets = dict(zip(range(N+1), [set() for i in range(N+1)]))
    sets[0].add(tuple())

    for i in range(1, N+1):
        prev_set = sets[i-1]
        for ps in prev_set:
            for j in range(len(ps)):
                cur = add_one_to_index(ps, j)
                sets[i].add(hashit(cur))
            cur = add_one_to_end(ps)
            sets[i].add(hashit(cur))
    sets.pop(0)
    return sets

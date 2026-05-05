import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 10000

# Generate realistic distributions
age = np.random.randint(18, 76, N)
income = np.clip(np.random.normal(75000, 40000, N), 25000, 300000)
# Most personal loans are small, some are large (like mortgages)
loan = np.clip(np.random.normal(30000, 80000, N), 5000, 600000)
credit = np.clip(np.random.normal(680, 70, N), 300, 850)

approved = []
for i in range(N):
    prob = 0.5 # Baseline
    
    # 1. Debt-to-Income Ratio (Crucial banking metric)
    dti = loan[i] / income[i]
    if dti > 2.0:     # E.g. $150k loan on $75k income
        prob -= 0.90  # Massive penalty
    elif dti > 1.0:
        prob -= 0.60
    elif dti < 0.4:
        prob += 0.30  # Very safe loan
        
    # 2. Credit Score
    if credit[i] < 620:
        prob -= 0.80  # Subprime
    elif credit[i] > 740:
        prob += 0.40  # Prime
        
    # 3. Income Tier
    if income[i] < 40000:
        prob -= 0.20
    elif income[i] > 120000:
        prob += 0.20
        
    # Add slight random noise to prevent deterministic overfitting
    prob += np.random.normal(0, 0.1)
    
    # Convert probability to binary outcome
    approved.append(1 if prob >= 0.5 else 0)

df = pd.DataFrame({
    'age': age.astype(int),
    'income': income.astype(int),
    'loan': loan.astype(int),
    'credit': credit.astype(int),
    'approved': approved
})

# Save to dataset folder
DATA_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'sample_data.csv')
os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
df.to_csv(DATA_PATH, index=False)

print(f"Generated realistic dataset. Approvals: {sum(approved)}, Rejections: {N - sum(approved)}")

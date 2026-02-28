#define SIM800_PWRKEY 7   // Arduino digital pin

void setup() {
  pinMode(SIM800_PWRKEY, OUTPUT);

  // Keep PWRKEY HIGH (idle state)
  digitalWrite(SIM800_PWRKEY, HIGH);

  delay(1000); // wait for power to stabilize

  // Trigger SIM800L power ON
  digitalWrite(SIM800_PWRKEY, LOW);
  delay(1200);                // hold LOW for 1–2 seconds
  digitalWrite(SIM800_PWRKEY, HIGH);

  // SIM800L is now booting
}

void loop() {
  // nothing needed here for PWRKEY
}

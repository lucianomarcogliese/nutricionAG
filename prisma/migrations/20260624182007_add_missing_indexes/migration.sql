-- CreateIndex
CREATE INDEX "Appointment_nutricionistaId_idx" ON "Appointment"("nutricionistaId");

-- CreateIndex
CREATE INDEX "Conversacion_nutricionistaId_idx" ON "Conversacion"("nutricionistaId");

-- CreateIndex
CREATE INDEX "FoodItem_mealId_idx" ON "FoodItem"("mealId");

-- CreateIndex
CREATE INDEX "Meal_planId_idx" ON "Meal"("planId");

-- CreateIndex
CREATE INDEX "NutritionPlan_profileId_idx" ON "NutritionPlan"("profileId");

-- CreateIndex
CREATE INDEX "PlanComida_planId_idx" ON "PlanComida"("planId");

-- CreateIndex
CREATE INDEX "PlanGrupo_comidaId_idx" ON "PlanGrupo"("comidaId");

-- CreateIndex
CREATE INDEX "TemplateComida_templateId_idx" ON "TemplateComida"("templateId");

import { Info } from 'lucide-react'

/**
 * Plain-language explanation shown at the top of the private-gallery design
 * page: what "design" means here, what is shared across galleries and what is
 * set per gallery.
 */
export function ClientPageDesignExplainer() {
  return (
    <section className="space-y-3 rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] px-5 py-4 text-sm leading-relaxed text-[#48464c]">
      <div className="flex items-center gap-2 text-base font-semibold text-[#100d1f]">
        <Info className="h-4 w-4 text-[#7D3A52]" aria-hidden />
        מה זה עיצוב גלריה פרטית?
      </div>
      <p>
        כשאת שולחת גלריה פרטית ללקוח, הוא נכנס לדף שנראה כמו שלך ולא כמו המערכת.
        כאן את קובעת איך הדף הזה נראה:
      </p>
      <ul className="list-disc space-y-1.5 pr-5">
        <li>
          <strong className="text-[#100d1f]">לוגו וצבע</strong> — מוגדרים פעם אחת
          כאן וחלים על כל הגלריות הפרטיות שלך, גם על גלריות שכבר נשלחו.
        </li>
        <li>
          <strong className="text-[#100d1f]">אם יש לך אתר</strong> — הדף לוקח את
          הלוגו והצבע מהאתר אוטומטית ואין צורך להגדיר כלום. אפשר להגדיר כאן ערכים
          אחרים, רק לדפי הלקוחות.
        </li>
        <li>
          <strong className="text-[#100d1f]">אם אין לך אתר</strong> — הגדירי כאן
          לוגו וצבע, וזה הכל.
        </li>
        <li>
          <strong className="text-[#100d1f]">תמונת כיסוי</strong> — נבחרת בכל
          גלריה בנפרד, בשלב יצירת הגלריה או אחר כך בהגדרות שלה. היא מוצגת בגדול
          בראש הדף רק אחרי שהלקוח נכנס עם קוד הכניסה. במסך הכניסה עצמו מוצגים
          הלוגו והצבע בלבד.
        </li>
      </ul>
    </section>
  )
}
